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

    #royal/straight flush
    if(flush and straight):
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

def compare_hands(people):
    best_idx = None
    best_score = float('-inf')
    for i in range(len(people)):
        temp = best_value(people[i])
        if temp > best_score:
            best_score = temp
            best_idx = [i]
        elif temp == best_score:
            best_idx.append(i)
    return best_idx