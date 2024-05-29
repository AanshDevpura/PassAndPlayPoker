from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
from pymongo import MongoClient
from bson import ObjectId, errors
import certifi
import random

# Connect to MongoDB cluster
cluster = MongoClient(
    "mongodb+srv://adevpura05:Devpura1@cluster0.yzk2hoy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    tlsCAFile=certifi.where()
)
db = cluster["cluster0"]
people_collection = db["people"]
board_collection = db["board"]

app = Flask(__name__)
CORS(app)

# Clear the database on startup (optional)
def clear_database():
    try:
        people_collection.delete_many({})
        board_collection.delete_many({})
        print("Database cleared successfully")
    except Exception as e:
        print("Error clearing database:", str(e))

clear_database()

# Get all people
@app.route("/people", methods=["GET"])
def get_people():
    people = list(people_collection.find())
    for person in people:
        person["_id"] = str(person["_id"])
    return jsonify(people)

# Add a new person
@app.route("/people", methods=["POST"])
def add_person():
    new_person = request.json
    new_person["dollars"] = float(new_person.get("dollars", 0))
    result = people_collection.insert_one(new_person)
    inserted_id = str(result.inserted_id)
    return jsonify({"_id": inserted_id, "name": new_person.get("name"), "dollars": new_person.get("dollars")}), 201

# Modify an existing person
@app.route("/people/<string:person_id>", methods=["PUT"])
def modify_person(person_id):
    updated_person = request.json
    updated_person["dollars"] = float(updated_person.get("dollars", 0))
    try:
        result = people_collection.update_one({"_id": ObjectId(person_id)}, {"$set": updated_person})
        if result.matched_count:
            return jsonify({"_id": person_id, "name": updated_person.get("name"), "dollars": updated_person.get("dollars")}), 200
        else:
            return jsonify({"error": "Person not found"}), 404
    except errors.InvalidId:
        return jsonify({"error": "Invalid ObjectId"}), 400

# Delete a person
@app.route("/people/<string:person_id>", methods=["DELETE"])
def delete_person(person_id):
    try:
        # if the person was before the dealer or was the dealer, decrement the dealer
        board = board_collection.find_one()
        if board:
            dealer = board.get("dealer", -1)
            people = list(people_collection.find().sort("_id", pymongo.ASCENDING))
            people_ids = [str(person["_id"]) for person in people]
            if dealer >= people_ids.index(person_id):
                board_collection.update_one({}, {"$inc": {"dealer": -1}})

        deleted_person = people_collection.find_one_and_delete({"_id": ObjectId(person_id)})
        if deleted_person:
            return jsonify({"_id": str(person_id), "name": deleted_person.get("name"), "dollars": deleted_person.get("dollars")}), 200
        else:
            return jsonify({"error": "Person not found"}), 404
    except errors.InvalidId:
        return jsonify({"error": "Invalid ObjectId"}), 400

# Modify big blind
@app.route("/poker/big_blind", methods=["POST"])
def modify_big_blind():
    try:
        big_blind_value = float(request.json.get("bigBlind"))        
        result = board_collection.update_one({}, {"$set": {"big_blind": big_blind_value}}, upsert=True)
        return jsonify("Big blind set"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get big blind if exists
@app.route("/poker/big_blind", methods=["GET"])
def get_big_blind():
    try:
        board = board_collection.find_one()
        if board:
            return jsonify(board.get("big_blind", 0)), 200
        else:
            return jsonify(''), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Simulate a deck of cards
class Deck:
    def __init__(self):
        self.cards = [f'{rank}{suit}' for suit in 'shdc' for rank in '23456789TJQKA']
        random.shuffle(self.cards)
    def deal_card(self):
        return self.cards.pop(0)

# Deal 2 cards to each player with money and deal board cards
# Initialize a lot of game variables
@app.route("/poker/deal", methods=["POST"])
def deal():
    try:
        undeal()
        players = list(people_collection.find({"dollars": {"$gt": 0}}))
        deck = Deck()
        for player in players:
            cards = [deck.deal_card() for _ in range(2)]
            people_collection.update_one({"_id": player["_id"]}, {"$set": {"hand": cards}})
        
        people_collection.update_many({}, {"$set": {"betted": 0}})
        set_can_raise()

        board_cards = [deck.deal_card() for _ in range(5)]
        board_collection.update_one({}, {"$set": {"board_cards": board_cards}}, upsert=True)
        board_collection.update_one({}, {"$set": {"game_state": 0}}, upsert=True)
        board_collection.update_one({}, {"$set": {"pot": 0}}, upsert=True)
        board_collection.update_one({}, {"$set": {"total_bet": 0}}, upsert=True)
        big_blind = board_collection.find_one().get("big_blind", 0)
        board_collection.update_one({}, {"$set": {"min_raise": big_blind}}, upsert=True)

        return jsonify("Successful deal"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Undeal all cards and reset the game variables
@app.route("/poker/undeal", methods=["DELETE"])
def undeal():
    try:
        people_collection.update_many({}, {"$unset": {"hand": ""}})
        people_collection.update_many({}, {"$unset": {"betted": ""}})
        board_collection.update_one({}, {"$unset": {"board_cards": ""}})
        board_collection.update_one({}, {"$unset": {"current_leader": ""}})
        board_collection.update_one({}, {"$unset": {"current": ""}})
        board_collection.update_one({}, {"$unset": {"post_flop_leader": ""}})
        board_collection.update_one({}, {"$unset": {"pot": ""}})
        board_collection.update_one({}, {"$unset": {"total_bet": ""}})
        board_collection.update_one({}, {"$unset": {"game_state": ""}})
        board_collection.update_one({}, {"$unset": {"min_raise": ""}})
        return jsonify("Successful undeal"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get the dealer, small blind, big blind, preflop leader, and postflop leader for the round
@app.route("/poker/special_people", methods=["GET"])
def get_special_players():
    try:
        people = list(people_collection.find().sort("_id", pymongo.ASCENDING))
        valid_players = [person for person in people if person["dollars"] > 0]
        valid_players_count = len(valid_players)
        if not valid_players or len(valid_players) == 1:
            board_collection.update_one({}, {"$unset": {"dealer": ""}})
            return jsonify([]), 200
        
        dealer = (board_collection.find_one().get("dealer", -1) + 1) % len(people)
        while people[dealer]["dollars"] == 0:
            dealer = (dealer + 1) % len(people)
        board_collection.update_one({}, {"$set": {"dealer": dealer}})

        if valid_players_count == 2:
            small_blind = dealer
        else:
            small_blind = (dealer + 1) % len(people)
            while people[small_blind]["dollars"] == 0:
                small_blind = (small_blind + 1) % len(people)

        big_blind = (small_blind + 1) % len(people)
        while people[big_blind]["dollars"] == 0:
            big_blind = (big_blind + 1) % len(people)
        
        pre_flop_leader = (big_blind + 1) % len(people)
        while people[pre_flop_leader]["dollars"] == 0:
            pre_flop_leader = (pre_flop_leader + 1) % len(people)
        board_collection.update_one({}, {"$set": {"current_leader": pre_flop_leader}})
        board_collection.update_one({}, {"$set": {"current": pre_flop_leader}})
        post_flop_leader = big_blind if valid_players_count == 2 else small_blind
        board_collection.update_one({}, {"$set": {"post_flop_leader": post_flop_leader}})
        return jsonify([dealer, small_blind, big_blind]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Increment the game state (0:4 - preflop, flop, turn, river, end)
def increment_game_state():
    try:
        board_collection.update_one({}, {"$inc": {"game_state": 1}})
        big_blind = board_collection.find_one().get("big_blind", 0)
        board_collection.update_one({}, {"$set": {"min_raise": big_blind}})
        set_can_raise()
        return jsonify("Game state incremented"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Increment the current player
# Updates game state if needed
def increment_current():
    try:
        people = list(people_collection.find().sort("_id", pymongo.ASCENDING))
        players_with_cards = [person for person in people if "hand" in person]
        if not players_with_cards or len(players_with_cards) == 1:
            board_collection.update_one({}, {"$set": {"game_state": 4}})
            return jsonify("Game over"), 200
        players_with_moves = [person for person in people if person["dollars"] > 0 and "hand" in person]
        current = board_collection.find_one().get("current", -1)
        current_leader = board_collection.find_one().get("current_leader", -1)
        next_round = False
        while True:
            current = (current + 1) % len(people)
            if(current_leader == current):
                if not players_with_moves or len(players_with_moves) == 1:
                    board_collection.update_one({}, {"$set": {"game_state": 4}})
                    return jsonify("Game over"), 200
                increment_game_state()
                current = board_collection.find_one().get("post_flop_leader", -1)
                next_round = True
            if people[current]["dollars"] > 0 and "hand" in people[current]:
                break
        if next_round:
            board_collection.update_one({}, {"$set": {"current_leader": current}})
        board_collection.update_one({}, {"$set": {"current": current}})
        return jsonify("Current incremented"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Raise the bet by a certain amount
@app.route("/poker/raise/<string:person_id>", methods=["POST"])
def raise_dollars(person_id):
    try:
        amount = float(request.json.get("amount"))
        person = people_collection.find_one({"_id": ObjectId(person_id)})
        if person:
            amount += board_collection.find_one().get("total_bet", 0) - person.get("betted", 0)
            people_collection.update_one({"_id": ObjectId(person_id)}, {"$inc": {"dollars": -amount}})
            people_collection.update_one({"_id": ObjectId(person_id)}, {"$inc": {"betted": amount}})
            board_collection.update_one({}, {"$inc": {"pot": amount}})
            current = board_collection.find_one().get("current", -1)
            board_collection.update_one({}, {"$set": {"current_leader": current}})
            total_bet = person.get("betted", 0) + amount
            board_collection.update_one({}, {"$set": {"total_bet": total_bet}})
            increment_current()
            return jsonify(amount), 200
        else:
            return jsonify({"error": "Person not found"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Call/check the bet
@app.route("/poker/call/<string:person_id>", methods=["POST"])
def call(person_id):
    try:
        person = people_collection.find_one({"_id": ObjectId(person_id)})
        set_cannot_raise(person_id)
        if person:
            total_bet = board_collection.find_one().get("total_bet", 0)
            amount = total_bet - person.get("betted", 0)
            amount = min(amount, person["dollars"])
            people_collection.update_one({"_id": ObjectId(person_id)}, {"$inc": {"dollars": -amount}})
            people_collection.update_one({"_id": ObjectId(person_id)}, {"$inc": {"betted": amount}})
            board_collection.update_one({}, {"$inc": {"pot": amount}})
            increment_current()
            return jsonify(amount), 200
        else:
            return jsonify({"error": "Person not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# Fold the hand
@app.route("/poker/fold/<string:person_id>", methods=["POST"])
def fold(person_id):
    try:
        people_collection.update_one({"_id": ObjectId(person_id)}, {"$unset": {"hand": ""}})
        increment_current()
        return jsonify("Successful fold"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
# Get all board variables
@app.route("/poker/board", methods=["GET"])
def get_board():
    try:
        board = board_collection.find_one()
        if board:
            board["_id"] = str(board["_id"])
            return jsonify(board), 200
        else:
            return jsonify({"error": "Board not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Raise the min raise
@app.route("/poker/min_raise", methods=["POST"])
def raise_min_raise():
    try:
        amount = float(request.json.get("amount"))
        board_collection.update_one({}, {"$set": {"min_raise": amount}})
        return jsonify(amount), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Set that everyone can raise
@app.route("/poker/can_raise", methods=["POST"])
def set_can_raise():
    try:
        people_collection.update_many({}, {"$set": {"can_raise": True}})
        return jsonify("Can Raise Updates"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Set the person cannot raise
@app.route("/poker/cannot_raise/<string:person_id>", methods=["POST"])
def set_cannot_raise(person_id):
    try:
        people_collection.update_one({"_id": ObjectId(person_id)}, {"$set": {"can_raise": False}})
        return ("Can Raise Updates"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    app.run(debug=True)
