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
            print(people_ids)
            print(dealer)
            if dealer >= people_ids.index(person_id):
                board_collection.update_one({}, {"$inc": {"dealer": -1}})

        deleted_person = people_collection.find_one_and_delete({"_id": ObjectId(person_id)})
        if deleted_person:
            return jsonify({"_id": str(person_id), "name": deleted_person.get("name"), "dollars": deleted_person.get("dollars")}), 200
        else:
            return jsonify({"error": "Person not found"}), 404
    except errors.InvalidId:
        return jsonify({"error": "Invalid ObjectId"}), 400

@app.route("/poker/big_blind", methods=["POST"])
def modify_big_blind():
    try:
        big_blind_value = request.json.get("bigBlind")        
        result = board_collection.update_one({}, {"$set": {"big_blind": big_blind_value}}, upsert=True)
        return jsonify("Big blind set"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/poker/big_blind", methods=["GET"])
def get_big_blind():
    try:
        big_blind = board_collection.find_one()
        if big_blind:
            return jsonify(big_blind.get("big_blind", 0)), 200
        else:
            return jsonify({"error": "Big blind not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

class Deck:
    def __init__(self):
        self.cards = [f'{rank}{suit}' for suit in 'shdc' for rank in '23456789TJQKA']
        random.shuffle(self.cards)
    def deal_card(self):
        return self.cards.pop(0)

# Deal 2 cards to each player and make board
@app.route("/poker/deal", methods=["POST"])
def deal():
    try:
        players = list(people_collection.find({"dollars": {"$gt": 0}}))
        deck = Deck()
        undeal()
        for player in players:
            cards = [deck.deal_card() for _ in range(2)]
            people_collection.update_one({"_id": player["_id"]}, {"$set": {"hand": cards}})
        
        board_cards = [deck.deal_card() for _ in range(5)]
        board_collection.update_one({}, {"$set": {"board": board_cards}}, upsert=True)
        board_collection.update_one({}, {"$set": {"game_state": 0}}, upsert=True)
        return jsonify("Successful deal"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/poker/undeal", methods=["DELETE"])
def undeal():
    try:
        people_collection.update_many({}, {"$unset": {"hand": ""}})
        board_collection.update_one({}, {"$unset": {"board": ""}})
        board_collection.update_one({}, {"$unset": {"current_leader": ""}})
        board_collection.update_one({}, {"$unset": {"current": ""}})
        board_collection.update_one({}, {"$unset": {"post_flop_leader": ""}})
        return jsonify("Successful undeal"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/poker/board_cards", methods=["GET"])
def get_flop():
    try:
        board = board_collection.find_one()
        if board:
            return jsonify(board.get("board", [])), 200
        else:
            return jsonify({"error": "Board not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/poker/fold/<string:person_id>", methods=["POST"])
def fold(person_id):
    try:
        people_collection.update_one({"_id": ObjectId(person_id)}, {"$unset": {"hand": ""}})
        return jsonify("Successful fold"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

@app.route("/poker/game_state", methods=["GET"])
def get_game_state():
    try:
        game_state = board_collection.find_one().get("game_state", -1)
        return jsonify(game_state), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/poker/game_state", methods=["POST"])
def increment_game_state():
    try:
        board_collection.update_one({}, {"$inc": {"game_state": 1}})
        return jsonify("Game state incremented"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/poker/current", methods=["POST"])
def increment_current():
    try:
        current = board_collection.find_one().get("current", -1)
        people = list(people_collection.find().sort("_id", pymongo.ASCENDING))
        valid_players = [person for person in people if person["dollars"] > 0 and "hand" in person]
        if not valid_players or len(valid_players) == 1:
            board_collection.update_one({}, {"$set": {"game_state": 4}})
            return jsonify("Game over"), 200
        current = (current + 1) % len(people)
        while people[current]["dollars"] == 0 or "hand" not in people[current]:
            current = (current + 1) % len(people)
        #fix this
        if(current == board_collection.find_one().get("current_leader", -1)):
            increment_game_state()
            current = board_collection.find_one().get("post_flop_leader", -1)
            board_collection.update_one({}, {"$set": {"current_leader": current}})
        board_collection.update_one({}, {"$set": {"current": current}})
        return jsonify("Current incremented"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/poker/current", methods=["GET"])
def get_current():
    try:
        current = board_collection.find_one().get("current", -1)
        return jsonify(current), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
