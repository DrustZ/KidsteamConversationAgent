
from os import stat

# {state_name: {reply_keyword: (next_state, [utterances])}
Dialogue_dict = {
    'start': {"yes": ("recap", ["Ok, thanks for the response. Before we move on, let’s recap what we heard yesterday: "+\
                        "our great superhero Zip helped the the child Alex to be more socially confident throughout the day. "+\
                        "At the end of the day, Alex was able to ask and join other kids playing on the playground by himself. "+\
                        "Alex successfully used self-talk to encourage himself to be brave. "+\
                        "Remember, at the end, I asked you both to talk about how superhero self-talk can help Alex "+\
                        "when he faces a challenge like failure on Math exam. Does anyone want to answer this question?"])},
    'recap': {"yes": ("sharing", ["Ok, can you share with me your answer to this question?"])},
    'sharing': {"NA": ("story0", ["Cool, thanks for sharing with me. Today we are going to continue the story with our superhero Zip and see how he can help another child.",
                        "Before we start our new journey. I want to ask you both, have you ever ask for help before. If you have asked others for help before, "+\
                        "can one of you share with me what did you ask and how did that help you to solve your difficulties?"])},
    'story0': {"NA": ("story1", ["Thanks for sharing! Today we are going to read how Zip help another child to ask for help. Now let’s move on to our story.",
                     "One evening, Zip was tired writing his homework. He decided to go out and help another child and he believed nobody would discover he was not in the house. Zip sneaked out of his bedroom....",
                     "how do you think Zip can sneak out without being discovered by his little brother and his parents?" + \
                      "A: He flew out from his bedroom window. B: He has a pair of super quiet shoes and used that every time he sneaked out. C: He can turn on his skill of super-invisible."])},
    'story1': {"abc": ("story2", ["Zip was flying and searching to see whether any kid need some help. And He noticed through a bedroom window that a girl named Lily was frustrated by a very hard math problem assigned by her teacher; Lily felt down and almost decided to quit; Lily told herself she was not someone who can understand math; She was not the type of person who can study this well;",
                        "If you cannot figure out some hard problems of your homework, what would you do? Talk with your partners, you have one minute."])},
    'story2': {'NA': ('story3', ["Ok, now let's come back to the story and see how Zip can help Lily with her super hard Math question. Lily was unwilling to ask and felt embarrassed not be able to answer the questions by her own...; Zip explained why asking for help would help her currently and in the long run (everybody needs help); Lily decided to ask for help.",
                        "Who do you think Lily would ask for help? A: Her best friend Sally. B: Her math teacher Mr. Boldar. C: Ask her parents to help her."])},
    'story3': {'a': ('story4', ['Lily called her friend Sally and Sally give her some hint and references; Lily was able to solve the problem with the help; Zip explained asking for help is as important as figuring out by oneself; Everybody learn from others.',
                                'How do you think Lily felt after Sally helped her? Discuss with your partners?']),
                'b':('story3', ['please select again']),
                'c':('story3', ['please select again'])},
    'story4': {'NA': ('recap2', ["Lily gave thanks to Zip saying she learned how to ask for help during a difficult challenge; "+\
                                "Zip was satisfied that he helped another child. But Zip suddenly remembered he has some homework exercises he need to finish for tomorrow’s classes. "+\
                                "Ouch...., he quickly said bye to Lily and flew back home....",
                                "Think of a time when you need help. Do you usually ask for help? How did you feel when you asked? Talk with each other!"])},
    'recap2': {'NA': ('question', ["[Recap of of today's lesson]: 1. importance of asking for help 2. how to ask for help nicely",
                                  "Are you always willing to ask for help?"])},
    'question': {'yes': ('learning', ['Can you share with me when and what happend when you ask for help?']),
                 'no':  ('learning', ['Can you share with each other why you are not willing to ask for help? What do you feel? Do you feel embarrassed or shy to ask for help?'])},
    'learning': {'NA': ('thanks', ["Have you ever asked each other for help? How do you feel when you asked? How do you feel when you hearing the other’s request? Think about these question, and I will ask one of you to share with me during tomorrow's story time."])},
    'thanks': {'NA': ('', ["Thanks for attending today’s story and learning a new asking for help skill. Remember to come back tomorrow. Just say launch superhero skill and I will tell you another story of our superhero Zip. See you tomorrow!"])}
}

Answer_keys = {
    'yes': ['yes', 'yeah', 'sure', 'ok', 'okay'],
    'no': ['no', 'nope', 'not'],
    'abc': ['a', 'at', 'hey', 'b', 'bee', 'beam', 'pee', 'p', 'c', 'see', 'sea'],
    'a': ['a', 'at', 'hey'],
    'b': ['b', 'bee', 'beam', 'p', 'pee'],
    'c': ['c', 'sea', 'see'],
}

Error_response = 'Sorry, please say the answer again? '

class dialogueMaintainer(object):
    def __init__(self, uid):
        self.uid = uid
        self.status = 'start'
        self.lastresponse = ['Are you ready to start a new adventure with our superhero Zip?']

    def getDialogue(self, userinput):
        user_words = set(userinput.lower().split(' '))
        answer_key_word = ''
        for key in Dialogue_dict[self.status].keys():
            if key == 'NA':
                answer_key_word = 'NA'
                break
            intersection = user_words.intersection(Answer_keys[key])
            if len(intersection) > 0:
                answer_key_word = key
                break
        # not finding a proper keyword, prompt again
        if len(answer_key_word) == 0:
            return [Error_response+self.lastresponse[-1]]
        
        next_state, responses = Dialogue_dict[self.status][answer_key_word]
        self.status = next_state
        self.lastresponse = responses
        return responses


