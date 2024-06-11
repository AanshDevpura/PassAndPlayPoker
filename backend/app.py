from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
from bson import ObjectId, errors
import certifi
import random
from dotenv import load_dotenv
import os
from poker import Deck, best_value, value_to_str

# Connect to MongoDB cluster
load_dotenv()
cluster = pymongo.MongoClient(
    os.getenv("MONGO_URI"),
    tlsCAFile=certifi.where()
)

db = cluster["cluster0"]
people_collection = db["people"]
board_collection = db["board"]

app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")
CORS(app)

@app.route("/")
def index():
    return app.send_static_file("index.html")

def generate_unique_id():
    while True:
        # Generate a random 6-digit ID
        unique_id = str(random.randint(100000, 999999))
        
        # Check if the ID already exists in the collection
        if not board_collection.find_one({"game_id": unique_id}):
            return unique_id

# Create a new game with id
@app.route("/games", methods=["POST"])
def create_game():
    try:
        game_id = generate_unique_id()
        board_collection.insert_one({"game_id": game_id})
        return jsonify({"game_id": str(game_id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete a game with id
# Must be post because its on unload
@app.route("/games/delete/<string:game_id>", methods=["POST"])
def delete_game(game_id):
    try:
        board_collection.delete_one({"game_id": game_id})
        people_collection.delete_many({"game_id": game_id})
        return jsonify("Game deleted"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get all people
@app.route("/games/<string:game_id>/people", methods=["GET"])
def get_people(game_id):
    people = list(people_collection.find({"game_id": game_id}))
    for person in people:
        person["_id"] = str(person["_id"])
    return jsonify(people)

# Add a new person
@app.route("/games/<string:game_id>/people", methods=["POST"])
def add_person(game_id):
    new_person = request.json
    new_person["cents"] = (int(float(new_person.get("dollars", 0)) * 100))
    new_person.pop("dollars", None) 
    new_person["game_id"] = game_id
    people_collection.insert_one(new_person)
    return jsonify("Person added"), 201

# Modify an existing person
@app.route("/games/<string:game_id>/people/<string:person_id>", methods=["PUT"])
def modify_person(game_id,person_id):
    updated_person = request.json
    updated_person["cents"] = (int(float(updated_person.get("dollars", 0)) * 100))
    updated_person.pop("dollars", None)
    try:
        result = people_collection.update_one({"_id": ObjectId(person_id), "game_id": game_id}, {"$set": updated_person})
        if result.matched_count:
            return jsonify("Person updated"), 200
        else:
            return jsonify({"error": "Person not found"}), 404
    except errors.InvalidId:
        return jsonify({"error": "Invalid ObjectId"}), 400

# Delete a person
@app.route("/games/<string:game_id>/people/<string:person_id>", methods=["DELETE"])
def delete_person(game_id, person_id):
    try:
        # if the person was before the dealer or was the dealer, decrement the dealer
        board = board_collection.find_one({"game_id": game_id})
        if board:
            dealer = board.get("dealer", -1)
            people = list(people_collection.find({"game_id": game_id}).sort("_id", pymongo.ASCENDING))
            people_ids = [str(person["_id"]) for person in people]
            if dealer >= people_ids.index(person_id):
                board_collection.update_one({"game_id": game_id}, {"$inc": {"dealer": -1}})

        deleted_person = people_collection.find_one_and_delete({"_id": ObjectId(person_id), "game_id": game_id})
        if deleted_person:
            return jsonify("Person deleted"), 200
        else:
            return jsonify({"error": "Person not found"}), 404
    except errors.InvalidId:
        return jsonify({"error": "Invalid ObjectId"}), 400

# Modify big blind
@app.route("/games/<string:game_id>/poker/big_blind", methods=["POST"])
def modify_big_blind(game_id):
    try:
        big_blind_value = int(float(request.json.get("bigBlind")) * 100)
        result = board_collection.update_one({"game_id": game_id}, {"$set": {"big_blind_value": big_blind_value}}, upsert=True)
        return jsonify("Big blind set"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get big blind if exists
@app.route("/games/<string:game_id>/poker/big_blind", methods=["GET"])
def get_big_blind(game_id):
    try:
        board = board_collection.find_one({"game_id": game_id})
        if board:
            big_blind_value = board.get("big_blind_value", None)
            if big_blind_value is not None:
                big_blind_value_dollars = float(big_blind_value) / 100
                return jsonify(big_blind_value_dollars), 200
            else:
                return jsonify(""), 200  # Return empty string if big blind doesn't exist or is 0
        else:
            return jsonify(""), 200  # Return empty string if board doesn't exist
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# Deal 2 cards to each player with money and deal board cards
# Initialize a lot of game variables
@app.route("/games/<string:game_id>/poker/deal", methods=["POST"])
def deal(game_id):
    try:
        undeal(game_id)
        players = list(people_collection.find({"game_id": game_id, "cents": {"$gt": 0}}))
        deck = Deck()
        for player in players:
            cards = [deck.deal_card() for _ in range(2)]
            people_collection.update_one({"_id": player["_id"], "game_id": game_id}, {"$set": {"hand": cards}})
        
        people_collection.update_many({"game_id": game_id}, {"$set": {"betted": 0, "can_raise": True, "show": False, "won": 0, "score": 0, "score_str": ""}})
        board_cards = [deck.deal_card() for _ in range(5)]
        board_collection.update_one({"game_id": game_id}, {"$set": {"board_cards": board_cards, "game_state": 0, "pot": 0}}, upsert=True)

        big_blind_value = board_collection.find_one({"game_id": game_id}).get("big_blind_value", 0)
        board_collection.update_one({"game_id": game_id}, {"$set": {"min_raise": big_blind_value, "bet_per_person": big_blind_value}}, upsert=True)

        people = list(people_collection.find({"game_id": game_id}).sort("_id", pymongo.ASCENDING))
        valid_players = [person for person in people if person["cents"] > 0]

        # Get the dealer, small blind, big blind, preflop leader, and postflop leader for the round
        people = list(people_collection.find({"game_id": game_id}).sort("_id", pymongo.ASCENDING))
        valid_players = [person for person in people if person["cents"] > 0]
        
        dealer = (board_collection.find_one({"game_id": game_id}).get("dealer", -1) + 1) % len(people)
        while people[dealer]["cents"] == 0:
            dealer = (dealer + 1) % len(people)
        board_collection.update_one({"game_id": game_id}, {"$set": {"dealer": dealer}}, upsert=True)

        if len(valid_players) == 2:
            small_blind = dealer
        else:
            small_blind = (dealer + 1) % len(people)
            while people[small_blind]["cents"] == 0:
                small_blind = (small_blind + 1) % len(people)
        
        board_collection.update_one({"game_id": game_id}, {"$set": {"small_blind_player": small_blind}}, upsert=True)
        big_blind = (small_blind + 1) % len(people)
        while people[big_blind]["cents"] == 0:
            big_blind = (big_blind + 1) % len(people)
        board_collection.update_one({"game_id": game_id}, {"$set": {"big_blind_player": big_blind}}, upsert=True)

        # Pay the small blind and big blind
        small_blind_pays = min(people[small_blind]["cents"], big_blind_value // 2)
        people_collection.update_one({"_id": people[small_blind]["_id"], "game_id": game_id}, {"$inc": {"cents": -small_blind_pays}})
        people_collection.update_one({"_id": people[small_blind]["_id"], "game_id": game_id}, {"$inc": {"betted": small_blind_pays}})
        board_collection.update_one({"game_id": game_id}, {"$inc": {"pot": small_blind_pays}})

        big_blind_pays = min(people[big_blind]["cents"], big_blind_value)
        people_collection.update_one({"_id": people[big_blind]["_id"],"game_id": game_id}, {"$inc": {"cents": -big_blind_pays}})
        people_collection.update_one({"_id": people[big_blind]["_id"],"game_id": game_id}, {"$inc": {"betted": big_blind_pays}})
        board_collection.update_one({"game_id": game_id}, {"$inc": {"pot": big_blind_pays}})

        people = list(people_collection.find({"game_id": game_id}).sort("_id", pymongo.ASCENDING))
        # Case for when only no moves left due to blinds
        new_valid_players = [person for person in people if person["cents"] > 0]
        if not new_valid_players or (len(new_valid_players) == 1 and new_valid_players[0]["betted"] == big_blind_value):
            board_collection.update_one({"game_id": game_id}, {"$set": {"game_state": 4}})
            people_collection.update_many({"game_id": game_id}, {"$set": {"show": True}})
            evaluate_winner(game_id)
            return jsonify("Game over"), 200
        pre_flop_leader = (big_blind + 1) % len(people)
        while people[pre_flop_leader]["cents"] == 0:
            pre_flop_leader = (pre_flop_leader + 1) % len(people)
        board_collection.update_one({"game_id": game_id}, {"$set": {"current_leader": pre_flop_leader}}, upsert=True)
        board_collection.update_one({"game_id": game_id}, {"$set": {"current": pre_flop_leader}}, upsert=True)
        post_flop_leader = big_blind if len(valid_players) == 2 else small_blind
        board_collection.update_one({"game_id": game_id}, {"$set": {"post_flop_leader": post_flop_leader}}, upsert=True)
        return jsonify("Successful deal"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Reset the game variables
@app.route("/games/<string:game_id>/poker/undeal", methods=["POST"])
def undeal(game_id):
    try:
        people_collection.update_many({"game_id": game_id}, {
            "$unset": {
                "hand": "",
                "betted": "",
                "can_raise": "",
                "show": "",
                "won": "",
                "score": "",
                "score_str": ""
            }
        })
        board_collection.update_one({"game_id": game_id}, {
            "$unset": {
                "board_cards": "",
                "current_leader": "",
                "current": "",
                "post_flop_leader": "",
                "pot": "",
                "bet_per_person": "",
                "game_state": "",
                "min_raise": "",
                "small_blind_player": "",
                "big_blind_player": ""
            }
        })
        return jsonify("Successful undeal"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Show the cards of a player
@app.route("/games/<string:game_id>/poker/show/<string:person_id>", methods=["POST"])
def show(game_id,person_id):
    try:
        current_show = people_collection.find_one({"_id": ObjectId(person_id),"game_id": game_id}).get("show", True)
        new_show = not current_show
        people_collection.update_one(
            {"_id": ObjectId(person_id), "game_id": game_id},
            {"$set": {"show": new_show}}
        )
        return jsonify("Successful show"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Increment the game state (0:4 - preflop, flop, turn, river, end)
def increment_game_state(game_id):
    try:
        board_collection.update_one({"game_id": game_id}, {"$inc": {"game_state": 1}})
        board = board_collection.find_one({"game_id": game_id})
        game_state = board.get("game_state", 0)
        big_blind_value = board.get("big_blind_value", 0)
        board_collection.update_one({"game_id": game_id}, {"$set": {"min_raise": big_blind_value}})
        people_collection.update_many({ "game_id": game_id}, {"$set": {"can_raise": True}})

        # Check if game state is 4 and evaluate winner
        if game_state == 4:
            people_collection.update_many({"game_id": game_id}, {"$set": {"show": True}})
            evaluate_winner(game_id)
        
        return jsonify("Game state incremented"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Increment the current player
# Updates game state if needed
def increment_current(game_id):
    try:
        people = list(people_collection.find({"game_id": game_id}).sort("_id", pymongo.ASCENDING))
        people_collection.update_many({"game_id": game_id}, {"$set": {"show": False}})
        players_with_cards = [person for person in people if "hand" in person]
        if not players_with_cards or len(players_with_cards) == 1:
            board_collection.update_one({"game_id": game_id}, {"$set": {"game_state": 4}})
            evaluate_winner(game_id)
            return jsonify("Game over"), 200
        players_with_moves = [person for person in people if person["cents"] > 0 and "hand" in person]
        current = board_collection.find_one({"game_id": game_id}).get("current", -1)
        current_leader = board_collection.find_one({"game_id": game_id}).get("current_leader", -1)
        next_round = False
        while True:
            current = (current + 1) % len(people)
            if(current_leader == current):
                if not players_with_moves or len(players_with_moves) == 1:
                    board_collection.update_one({"game_id": game_id}, {"$set": {"game_state": 4}})
                    people_collection.update_many({"game_id": game_id}, {"$set": {"show": True}})
                    evaluate_winner(game_id)
                    return jsonify("Game over"), 200
                increment_game_state(game_id)
                if board_collection.find_one({"game_id": game_id}).get("game_state", 0) == 4:
                    return jsonify("Game over"), 200
                current = board_collection.find_one({"game_id": game_id}).get("post_flop_leader", -1)
                next_round = True
            if people[current]["cents"] > 0 and "hand" in people[current]:
                break
        if next_round:
            board_collection.update_one({"game_id": game_id}, {"$set": {"current_leader": current}})
        board_collection.update_one({"game_id": game_id}, {"$set": {"current": current}})
        return jsonify("Current incremented"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Raise the bet by a certain amount
@app.route("/games/<string:game_id>/poker/raise/<string:person_id>", methods=["POST"])
def raise_cents(game_id,person_id):
    try:
        original_amount = int(request.json.get("amount"))    
        person = people_collection.find_one({"_id": ObjectId(person_id), "game_id": game_id})
        if person:
            new_amount = original_amount + board_collection.find_one({"game_id": game_id}).get("bet_per_person", 0) - person.get("betted", 0)
            people_collection.update_one({"_id": ObjectId(person_id), "game_id": game_id}, {"$inc": {"cents": -new_amount}})
            people_collection.update_one({"_id": ObjectId(person_id), "game_id": game_id}, {"$inc": {"betted": new_amount}})
            board_collection.update_one({"game_id": game_id}, {"$inc": {"pot": new_amount}})
            current = board_collection.find_one({"game_id": game_id}).get("current", -1)
            board_collection.update_one({"game_id": game_id}, {"$set": {"current_leader": current}})
            board_collection.update_one({"game_id": game_id}, {"$inc": {"bet_per_person": original_amount}})
            min_raise = board_collection.find_one({"game_id": game_id}).get("min_raise", 0)
            if original_amount >= min_raise:
                board_collection.update_one({"game_id": game_id}, {"$set": {"min_raise": original_amount}})
                people_collection.update_many({"game_id": game_id}, {"$set": {"can_raise": True}})
                people_collection.update_one({"_id": ObjectId(person_id), "game_id": game_id}, {"$set": {"can_raise": False}})
            increment_current(game_id)
            return jsonify(original_amount), 200
        else:
            return jsonify({"error": "Person not found"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Call/check the bet
@app.route("/games/<string:game_id>/poker/call/<string:person_id>", methods=["POST"])
def call(game_id,person_id):
    try:
        person = people_collection.find_one({"_id": ObjectId(person_id), "game_id": game_id})
        people_collection.update_one({"_id": ObjectId(person_id), "game_id": game_id}, {"$set": {"can_raise": False}})
        if person:
            bet_per_person = board_collection.find_one({"game_id": game_id}).get("bet_per_person", 0)
            amount = bet_per_person - person.get("betted", 0)
            amount = min(amount, person["cents"])
            people_collection.update_one({"_id": ObjectId(person_id), "game_id": game_id}, {"$inc": {"cents": -amount}})
            people_collection.update_one({"_id": ObjectId(person_id), "game_id": game_id}, {"$inc": {"betted": amount}})
            board_collection.update_one({"game_id": game_id}, {"$inc": {"pot": amount}})
            increment_current(game_id)
            return jsonify(amount), 200
        else:
            return jsonify({"error": "Person not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
# Fold the hand
@app.route("/games/<string:game_id>/poker/fold/<string:person_id>", methods=["POST"])
def fold(game_id, person_id):
    try:
        people_collection.update_one({"_id": ObjectId(person_id), "game_id": game_id}, {"$unset": {"hand": ""}})
        increment_current(game_id)
        return jsonify("Successful fold"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
# Get all board variables
@app.route("/games/<string:game_id>/poker/board", methods=["GET"])
def get_board(game_id):
    try:
        board = board_collection.find_one({"game_id": game_id})
        if board:
            board["_id"] = str(board["_id"])
            return jsonify(board), 200
        else:
            return jsonify({"error": "Board not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Evaluate the winner of the round and distribute the pot
def evaluate_winner(game_id):
    try:
        board = board_collection.find_one({"game_id": game_id})
        board_cards = board.get("board_cards", [])
        pot = board.get("pot", 0)

        people_with_cards = list(people_collection.find({"game_id": game_id, "hand": {"$exists": True}}))
        people_values = []
        for person in people_with_cards:
            person_value = best_value(person["hand"] + board_cards)
            people_values.append(person_value)
            people_collection.update_one({"_id": person["_id"], "game_id": game_id}, {"$set": {"score": person_value}})
            people_collection.update_one({"_id": person["_id"], "game_id": game_id}, {"$set": {"score_str": value_to_str(person_value)}})
       
        people = list(people_collection.find({"game_id": game_id}))
        people_with_cards = [person for person in people if "hand" in person]

        while pot > 0:
            winners = []
            best_score = max(people_values)
            for i, person in enumerate(people_with_cards):
                if person.get("score") == best_score:
                    winners.append(person)
                    person["score"] = 0
                    people_values[i] = 0
            random.shuffle(winners)
            winners.sort(key=lambda x: (x["betted"], x["cents"]))
            num_winners = len(winners)
            for i in range(num_winners):
                winner = winners[i]
                winner_betted = winner.get("betted", 0)
                winning_amount = 0
                for person in people:
                    money_won_from_person = min(person.get("betted", 0), winner_betted)
                    person["betted"] = person.get("betted", 0) - money_won_from_person
                    pot -= money_won_from_person
                    winning_amount += money_won_from_person
                win_per_winner = winning_amount // (num_winners - i)
                remainder = winning_amount % (num_winners - i)
                for j in range(i, num_winners):
                    if remainder > 0:
                        adjusted_win_per_winner = win_per_winner + 1
                        remainder -= 1
                    else :
                        adjusted_win_per_winner = win_per_winner
                    people_collection.update_one({"_id": winners[j]["_id"], "game_id": game_id}, {"$inc": {"cents": adjusted_win_per_winner}})
                    people_collection.update_one({"_id": winners[j]["_id"], "game_id": game_id}, {"$inc": {"won": adjusted_win_per_winner}})
        board_collection.update_one({"game_id": game_id}, {"$set": {"pot": 0}})
        board_collection.update_one({"game_id": game_id}, {"$set": {"current": -1}})
        board_collection.update_one({"game_id": game_id}, {"$set": {"current_leader": -1}})
        return jsonify("Winner evaluated"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()

