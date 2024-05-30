from collections import Counter
from itertools import combinations
import random
card_values = {
    '2': 0,
    '3': 1,
    '4': 2,
    '5': 3,
    '6': 4,
    '7': 5,
    '8': 6,
    '9': 7,
    'T': 8,
    'J': 9,
    'Q': 10,
    'K': 11,
    'A': 12
}

reverse_card_values = {v: k for k, v in card_values.items()}

hand_type_dict = {
    9: "Royal Flush",
    8: "Straight Flush",
    7: "Four of a Kind",
    6: "Full House",
    5: "Flush",
    4: "Straight",
    3: "Three of a Kind",
    2: "Two Pair",
    1: "One Pair",
    0: "High Card"
}

class Deck:
    def __init__(self):
        self.cards = [f'{rank}{suit}' for suit in 'shdc' for rank in '23456789TJQKA']
        random.shuffle(self.cards)
    def deal_card(self):
        return self.cards.pop(0)

def is_flush(suits):
    return len(set(suits)) == 1

def is_straight(ranks):
    #special case for A,2,3,4,5
    return all(ranks[i] - 1 == ranks[i+1] for i in range(len(ranks) - 1)) or ranks == [12, 3, 2, 1, 0]
    
def hand_value(hand):
    suits = [card[1] for card in hand]
    #ordered decending
    ranks = sorted([card_values[card[0]] for card in hand], reverse = True)

    flush = is_flush(suits)
    straight = is_straight(ranks)
    #royal and straight flush
    if(flush and straight):
        #royal flush
        if ranks == [12, 11, 10, 9, 8]:
            return (9 << 20)
        #special case for A,2,3,4,5
        if ranks == [12, 3, 2, 1, 0]:
            return (8 << 20) + 3
        return (8 << 20) + ranks[0]
    
    most_common = Counter(ranks).most_common()
    
    #4 of a kind
    if most_common[0][1] == 4:
        return (7 << 20) + (most_common[0][0] << 4) + most_common[1][0]
        
    #full house
    if most_common[0][1] == 3 and most_common[1][1] == 2:
        return (6 << 20) + (most_common[0][0] << 4) + most_common[1][0]
        
    #flush
    if flush:
        return (5 << 20) + (ranks[0] << 16) + (ranks[1] << 12) + (ranks[2] << 8) + (ranks[3] << 4) + ranks[4]
        
    #straight
    if straight:
        #special case for A,2,3,4,5
        if ranks == [12, 3, 2, 1, 0]:
            return (4 << 20) + 3
        return (4 << 20) + ranks[0]
        
    #three of a kind
    if most_common[0][1] == 3:
        return (3 << 20) + (most_common[0][0] << 8) + (most_common[1][0] << 4) + most_common[2][0]
        
    #two pair
    if most_common[0][1] == 2 and most_common[1][1] == 2:
        return (2 << 20) + (most_common[0][0] << 8) + (most_common[1][0] << 4) + most_common[2][0]
        
    #one pair
    if most_common[0][1] == 2:
        return (1 << 20) + (most_common[0][0] << 12) + (most_common[1][0] << 8) + (most_common[2][0] << 4) + most_common[3][0]
    
    #high card
    return (ranks[0] << 16) + (ranks[1] << 12) + (ranks[2] << 8) + (ranks[3] << 4) + ranks[4]

def best_value(seven_hand):
    best = float('-inf')
    for five_hand in combinations(seven_hand, 5):
        best = max(best, hand_value(five_hand))
    return best


def value_to_str(value):
    hand_type = value >> 20
    hand_values = [reverse_card_values[(value >> (4 * i)) & 15] for i in range(5)]

    if hand_type == 9:
        return hand_type_dict[hand_type]
    if hand_type == 8:
        return f"Straight Flush: {hand_values[0]} high"
    if hand_type == 7:
        return f"Four of a Kind: {hand_values[1]}s with {hand_values[0]} kicker"
    if hand_type == 6:
        return f"Full House: {hand_values[1]}s over {hand_values[0]}s"
    if hand_type == 5:
        return f"Flush: {hand_values[4]}, {hand_values[3]}, {hand_values[2]}, {hand_values[1]},and {hand_values[0]}"
    if hand_type == 4:
        return f"Straight: {hand_values[0]} high"
    if hand_type == 3:
        return f"Three of a Kind: {hand_values[2]}s with {hand_values[1]} and {hand_values[0]} kickers"
    if hand_type == 2:
        return f"Two Pair: {hand_values[2]}s and {hand_values[1]}s with {hand_values[0]} kicker"
    if hand_type == 1:
        return f"One Pair: {hand_values[3]}s with {hand_values[2]}, {hand_values[1]}, and {hand_values[0]} kickers"
    if hand_type == 0:
        return f"High Card: {hand_values[4]}, {hand_values[3]}, {hand_values[2]}, {hand_values[1]},and {hand_values[0]}"
