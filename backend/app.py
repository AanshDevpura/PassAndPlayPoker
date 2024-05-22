from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
from pymongo import MongoClient
from bson import ObjectId, errors
import certifi

cluster = MongoClient("mongodb+srv://adevpura05:Devpura1@cluster0.yzk2hoy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", tlsCAFile=certifi.where())
db = cluster["cluster0"]
people_collection = db["people"]

app = Flask(__name__)
CORS(app)
def clear_database():
    try:
        people_collection.delete_many({})
        print("Database cleared successfully")
    except Exception as e:
        print("Error clearing database:", str(e))
clear_database()
@app.route("/people", methods=["GET"])
def get_people():
    people = list(people_collection.find())
    for person in people:
        person["_id"] = str(person["_id"])
    return jsonify(people)

@app.route("/people", methods=["POST"])
def add_person():
    new_person = request.json
    result = people_collection.insert_one(new_person)
    inserted_id = str(result.inserted_id)
    return jsonify({"_id": inserted_id, "name": new_person.get("name")}), 201

@app.route("/people/<string:person_id>", methods=["PUT"])
def modify_person(person_id):
    updated_person = request.json
    try:
        result = people_collection.update_one({"_id": ObjectId(person_id)}, {"$set": updated_person})
        return jsonify({"_id": person_id, "name": updated_person.get("name")}), 200
    except errors.InvalidId:
        return jsonify({"error": "Invalid ObjectId"}), 400

@app.route("/people/<string:person_id>", methods=["DELETE"])
def delete_person(person_id):
    try:
        deleted_person = people_collection.find_one_and_delete({"_id": ObjectId(person_id)})
        if deleted_person:
            return jsonify({"_id": str(person_id), "name": deleted_person.get("name")})
        else:
            return jsonify({"error": "Person not found"}), 404
    except errors.InvalidId:
        return jsonify({"error": "Invalid ObjectId"}), 400

if __name__ == "__main__":
    app.run(debug=True)
