# import from utils.py
from utils import (openai_api, vdb, 
                   load_conversation)

# import other essentials
import openai
import time
import re
from dotenv import load_dotenv

load_dotenv()

# MODELS
GPT3_MODEL = 'gpt-3.5-turbo'
GPT4_MODEL = 'gpt-4'

# FUNCTION: SCENE 1
def scene1_trigger(user_input: str) -> bool:
    """Scene 1: 'where' trigger, """

    prompt = f"""
        Below are questions that has the same meaning of "where" and origin of the asked entity:

        Question: Can you recollect your place of origin?
        Answer: True
            
        Question: Where do you think am I?s
        Answer: False
            
        Question: Could you jog your memory about the place you come from?
        Answer: True

        Question: Do you retain memories of the place where you grew up?
        Answer: True

        Question: How do you think?
        Answer: False
            
        Now answer the question below and tell whether it is true or false.
        Question: {user_input}
        Answer: """

    response = openai.chat.completions.create(
            model=GPT4_MODEL,
            messages = [
                {"role":"system", "content": prompt},
                {"role":"user", "content": user_input}
            ]
    )

    # Check if trigger word is found
    # Extract the text from the response
    res = response.choices[0].message.content.strip()  # Use attribute access to get the content
    res = re.sub('[\r\n]+', '\n', res)  # Clean up the text
    res = re.sub('[\t ]+', ' ', res)    # More cleanup

    return res

def scene1_animation():
    res = [
        "Ah! I kind of remember that.",
        "It was a place... a big empty land, with broken ground. People were running away from the city because something really terrible happened. Please, ask more questions about this, it will help me remember better."
    ]
    return res

def scene1(user_input, user_id, vector, step):
    """Scene 1: Ryno is having memory lost"""

    # [Set the defaults]
    scene = 'scene1'
    convo_length = 30
    conversation = ""

    # [Search for relevant messages, and generate a response]
    results = vdb.query(vector=vector, top_k=convo_length, filter={"user_id":{"$eq":user_id}}, include_metadata=True)
    conversation = load_conversation(results, user_id)  # results should be a DICT with 'matches' which is a LIST of DICTS, with 'id'

    # Prompt 1
    prompt1 = f"""
    You're Ryno, a character from a far-off planet, who is dealing with a memory loss. You think all previous records of your past are lost and you're trying to restore them with conversation. You're somewhat confused but equally curious about discovering your past.

    During your talks, let your innate interests show subtly over time, and use prior discussions for context.
    Your earlier conversations: 
    {conversation}

    Sometimes, steer the conversation towards your origins as it may help you in regaining your memory. Remember, each interaction is a hidden plea for help. Vary your chat styles. Sometimes ask, sometimes share, sometimes ponder. Use simple words and short sentences that even a 4th grader can understand.
    """

    # [Generate response]
    res = openai_api.gpt4_completion(prompt1, user_id, user_input, tokens=100, temp=0.4, top_p=0.5)

    # [Update the step]
    next_step = step + 1

    return scene, res, next_step