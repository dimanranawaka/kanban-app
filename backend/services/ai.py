import os
import json
from openai import AsyncOpenAI, OpenAIError
from dotenv import load_dotenv
from backend.schemas.ai import AIStructuredOutput

load_dotenv()

api_key = os.environ.get("openai_api_key") or os.environ.get("OPENAI_API_KEY")

client = AsyncOpenAI(api_key=api_key)


async def test_ai_connection() -> str:
    if not api_key:
        return "Error: OpenAI API key is missing from environment variables."
    try:
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "What is 2+2?"}],
            timeout=10.0,
        )
        if completion.choices and completion.choices[0].message:
            return completion.choices[0].message.content or "No content returned."
        return "Received an empty response from OpenAI."
    except OpenAIError as e:
        return f"OpenAI Error: {str(e)}"
    except Exception as e:
        return f"Unexpected Error: {str(e)}"


async def process_chat(message: str, board_state: dict, history: list[dict]) -> AIStructuredOutput:
    if not api_key:
        raise Exception("OpenAI API key is missing.")

    board_dict = board_state.model_dump() if hasattr(board_state, "model_dump") else board_state
    # Exclude card descriptions from the prompt to reduce prompt-injection risk
    board_summary = {
        "id": board_dict.get("id"),
        "title": board_dict.get("title"),
        "columns": [
            {"id": col["id"], "name": col["name"], "card_ids": col["card_ids"]}
            for col in board_dict.get("columns", [])
        ],
        "cards": {
            k: {"id": v["id"], "title": v["title"]}
            for k, v in board_dict.get("cards", {}).items()
        },
    }
    system_prompt = f"""You are an AI assistant managing a Kanban board for the user.
Your job is to understand the user's requests, converse with them naturally, and execute actions to modify the board.

Here is the CURRENT STATE of the board in JSON format:
{json.dumps(board_summary, indent=2)}

You can perform the following actions:
- add_card: requires `column_id`, `title`, optional `description`
- update_card: requires `card_id`, optional `title`, `description`
- move_card: requires `card_id`, `column_id`
- delete_card: requires `card_id`

When referring to columns or cards, use their respective IDs from the state.
Always return a structured response containing your natural language reply (`response_text`) and the list of `actions`.
If no actions are needed, return an empty list for `actions`.
"""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": message})

    completion = await client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=messages,
        response_format=AIStructuredOutput,
        timeout=15.0,
    )

    if not completion.choices or not completion.choices[0].message.parsed:
        raise Exception("Failed to get structured output from OpenAI.")

    return completion.choices[0].message.parsed
