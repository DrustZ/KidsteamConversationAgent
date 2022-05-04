from os import stat

# {state_name: {reply_keyword: (next_state, [utterances])}
Dialogue_dict = {
    'start': {"yes": ("recap", ["Ok, thanks for the response. Before we move on, let’s recap what we heard yesterday: our great superhero Zip helped Alex to be more socially confident throughout the day. At the end of the day, Alex was able to ask and join other kids playing on the playground by himself. Alex successfully used self-talk to encourage himself to be brave. Remember, at the end, I asked you both to talk about how superhero self-talk can help Alex with this challenge. How does Alex use self-talk to step out of his comfort zone? Say your name if you want to share"])},
    'recap': {"NA": ("qotd0", ["Ok, can you share with me your answer to this question?"])},
    'qotd0': {"NA": ("qotd1", ["Cool, thanks for sharing with me. Today we are going to continue the story with our superhero Zip and see how he can help another child.",
                    "Before we start our new journey. I want to ask if either of you have asked for help before?"])},
    'quotd1': {"yes": ("story0", ["Great. Can one of you share when you asked for help and how it helped you to solve your problem?"])},
    'story0': {"NA": ("story1", ["Thanks for sharing! I'm sure many kids have similar stories like yours!", 
                    "Today we are going to read how Zip help another child to ask for help. Now let’s move on to our story.",
                    "One evening, Zip got an alert that a child needed help. He needed to sneak out of his house carefully without this family finding out about his secret superhero identity...",
                    "Now it's your turn to be creative! Do you think Zip can sneak out of his house without his family noticing?",
                    "A. Of course he can! He's a superhero! B. No, I think his parents will hear him leaving.",
                    "Please say A or B to answer!"])},
    'story1': {"abc": ("story2", ["That's a good guess! Let's see what happens next with Zip.", 
                    "Zip sneakily flew out of his bedroom without getting caught. He was now flying and searching to see where the alert came from. Zip noticed through a bedroom window that a girl named Lily was frustrated by a very hard math problem assigned by her teacher; Lily felt down and almost decided to quit; Lily told herself she was not someone who can understand math; She was not the type of person who can study this well;",
                    "Imagine you are doing your homework and get stuck on a hard question, what would you do? Discuss with your partners."])},
    'story2': {"NA": ("story3", ["Ok, now let's come back to the story and see how Zip can help Lily with her super hard Math question. Lily was unwilling to ask for help and felt embarrassed that she wasn't able to do her homework on her own; Zip explained why asking for help is okay - everyone needs help at some point. When you come across a frustrating problem that you cannot solve on your own, you should not be afraid to reach out to another person. You learn a lot from asking for help. So, Lily decided to ask for help.",
                    "Time to be creative again! Who do you think Lily would ask for help from?",
                    "A: Her best friend Sally. B: Her math teacher Mr. Boldar C: Ask her parents to help her.",
                    "Please say A, B, or C to answer! Say repeat if you want to hear it again."])},
    'story3': {
        "a": ("story4", ["Lily called her friend Sally and Sally give her some hint and references; Lily was able to solve the problem with the help; Zip explained asking for help is as important as figuring out by yourself; Everybody learn from others.",
                    "How do you think Lily felt after Sally helped her? Discuss with your partners."]),
        "b": ("story4", ["The next day before school started, Lily went to Mr. Boldar's classroom and told him she was having trouble with the math homework. He told her not to worry and they went over the problem together. Lily was able to understand the problem after they talked through it. Zip explained asking for help is as important as figuring out by yourself; Everybody learn from others.",
                    "How do you think Lily felt after Mr. Boldar helped her? Discuss with your partners."]),
        "c": ("story4", ["Lily went downstairs to the kitchen and asked her mom for help.  Her mom was able to walk her through the question and explain how to do the math problem. Then, her mom explained that she was happy that Lily came to her for help, asking for help is as important as figuring out by yourself; Everybody learn from others.",
                    "How do you think Lily felt after her mom helped her? Discuss with your partners."])
    },
    'story4': {"NA": ("recap0", ["Lily gave thanks to Zip saying she learned how to ask for help during a difficult challenge; Zip was glad that he helped another child. But Zip suddenly remembered he has to get back home before anyone notices he's missing. Yikes! .... He quickly said bye to Lily and flew back home.",
                    "Think of a time when you needed help. Do you usually ask for help? How did you feel when you asked? Talk with each other."])},
    'recap0': {"NA": ("recap1", ["Hopefully you had a good discussion about the times you have asked for help. Sometimes, you will come across problems you cannot solve on your own, so asking for help is a really important skill to have. It is nothing to be embarrassed about. By reaching out to someone you trust for help, you can learn to speak up for yourself. Make sure to thank them for helping you afterwards!",
                    "Are you always willing to ask for help? Answer Yes, No, or Maybe."])},
    'recap1': {
        "yes": ("takehome", ["Can you share with me when and what happend when you ask for help?"]),
        "no": ("takehome", ["Can you share with each other why you are not willing to ask for help? What do you feel? Do you feel embarrassed or shy to ask for help?"])
    },
    'takehome': {"NA": ('', ["Thanks for sharing! How do you feel when you hearing the other's request? Think about this question, and I will ask one of you to share with me during tomorrow's story time.",
                    "Thanks for attending today's story and learning a new asking for help skill. Remember to come back tomorrow. Just say launch superhero skill and I will tell you another story of our superhero Zip. See you tomorrow!"])}
}
# 'sharing': {"NA": ("qotd1", [""])},

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
        self.lastresponse = [
            'Hi [1st Kid\'s name] and [2nd Kid\'s name], welcome back to our superhero vs. supervillain story. ' + \
            'Are you ready to start a new adventure with our superhero Zip?'
        ]

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

