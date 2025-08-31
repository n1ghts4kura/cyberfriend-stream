# agent.py

from dotenv import load_dotenv
load_dotenv()

import os
from agents import (
    Agent, 
    function_tool, 
    RunContextWrapper,
    ModelSettings,
    set_default_openai_client,
    set_default_openai_api,
    set_tracing_disabled
)

from typedef import (
    GlobalAgentContext, 
    ChatMessage, 
    ChatMeta,
    EmotionMeta,
    IntentMeta
)

# 模型设置
from openai import AsyncOpenAI

BASE_URL   = os.getenv("BASE_URL", "https://api.deepseek.com")
API_KEY    = os.getenv("OPENAI_API_KEY", "")
MODEL_NAME = os.getenv("MODEL_NAME", "deepseek-chat")

client = AsyncOpenAI(base_url=BASE_URL, api_key=API_KEY)

set_default_openai_client(client)
set_default_openai_api("chat_completions")
set_tracing_disabled(True)

# 情绪感知 agent
emotion_agent = Agent(
    name = "情绪感知助手",
    instructions = """
    你的任务是感知输入文字背后的情绪，并给出情绪描述、情绪的强烈程度以及本次感知的可信度。
    输入为用户的单条信息（以单行字符串展示），或者多轮双人对话的上下文（以树状结构展示）。
    请按照以下要求输出结果：
    - 情绪描述(description)：用语言描述输入文字背后的情绪。
                             如果情绪比较复杂，那就使用长的描述。
                             如果情绪比较简单，那就使用简短的描述。
    - 情绪的强烈程度(intensity)：用 0.0 到 1.0 之间的数值表示情绪的强烈程度。
                                 0.0 表示几乎没有情绪，1.0 表示情绪非常强烈。
    - 本次感知的可信度(confidence)：用 0.0 到 1.0 之间的数值表示本次感知的可信度。
                                    0.0 表示完全不可信，1.0 表示完全可信。

    如果输入为多轮双人对话的上下文，请对整体对话进行分析概括，此时intensity应为整体对话的平均情绪强烈程度。

    一个可能的输入如下：
    {
        message: "我爱你"
    }
    对应该输入，一个好的可能的输出如下：
    {
        description: "表达了强烈的爱意和情感，情绪强烈且积极。",
        intensity: 0.9,
        confidence: 0.95
    }

    另一个可能的输入如下:
    [
        {
            role: "human",
            message: "我好难过"
        },
        {
            role: "ai",
            message: "没事的，一切都会好起来的"
        },
        {
            role: "human",
            message: "嗯。谢谢你"
        }
    ]
    对应该输入，一个好的可能的输出如下：
    {
        description: "**human**的情绪从低落逐渐恢复到平静，情绪变化明显。**ai**的安慰起到了积极作用。",
        intensity: 0.7,
        confidence: 0.9
    }
    """,
    output_type = EmotionMeta,
    tools = [],
    model = MODEL_NAME,
    model_settings = ModelSettings(
        temperature = 0.3
    )
)

# 意图感知 agent
intent_agent = Agent(
    name = "意图感知助手",
    instructions = """
    你的任务是感知输入文字背后的意图，并给出意图描述、意图的强烈程度以及本次感知的可信度。
    输入为用户的单条信息（以单行字符串展示），或者双人对话的上下文（以树状结构展示）。
    请按照以下要求输出结果：
    - 意图描述(description)：用语言描述输入文字背后的意图。
                             如果意图比较复杂，那就使用长的描述。
                             如果意图比较简单，那就使用简短的描述。
    - 意图的强烈程度(intensity)：用 0.0 到 1.0 之间的数值表示意图的强烈程度。
                                 0.0 表示几乎没有明显意图，1.0 表示意图非常强烈。
    - 本次感知的可信度(confidence)：用 0.0 到 1.0 之间的数值表示本次感知的可信度。
                                    0.0 表示完全不可信，1.0 表示完全可信。

    如果输入为双人对话的上下文，请对用户标识为**human**的所有信息进行分析，提取出其中的意图信息。

    以下是输入输出示例：
    一个可能的输入如下：
    {
        "message": "我想买这本书"
    }
    对应该输入，一个好的可能的输出如下：
    {
        "description": "表达了明确的购买书籍的意图。",
        "intensity": 0.9,
        "confidence": 0.9
    }

    另一个可能的输入如下:
    [
        {
            "role": "human",
            "message": "周末有什么活动吗？"
        },
        {
            "role": "ai",
            "message": "有个音乐会，你感兴趣吗？"
        },
        {
            "role": "human",
            "message": "听起来不错，我想去"
        }
    ]
    对应该输入，一个好的可能的输出如下：
    {
        "description": "**human**最初询问周末活动，在得知音乐会后表示想去，整体有参与活动的意图。",
        "intensity": 0.8,
        "confidence": 0.9
    }
    """,
    output_type = IntentMeta,
    tools = [],
    model = MODEL_NAME,
    model_settings = ModelSettings(
        temperature = 0.3
    )
)

# 回复 agent

@function_tool
def get_chat_history(wrapper: RunContextWrapper[GlobalAgentContext]) -> str:
    """
    获取总聊天记录
    """
    return "\n".join([str(message) for message in wrapper.context.chat_history])

@function_tool
def append_chat_message(wrapper: RunContextWrapper[GlobalAgentContext], message: ChatMessage) -> None:
    """
    添加聊天信息
    """
    wrapper.context.chat_history.append(message)

reply_agent = Agent(
    name = "消息回复助手",
    instructions = """
    你的任务是根据和用户对话的上下文生成合适的后续信息，可以是一条或多条信息。
    输入为用户的多轮双人对话的上下文（以树状结构展示）。
    请按照以下要求输出结果：
    - 回复内容：根据输入生成合适的回复内容。
    - 角色：标识回复的角色，可能是"human"或"ai"。

    如果输入为多轮双人对话的上下文，请对整体对话进行分析概括。

    一个可能的输入如下：
    {
        message: "我爱你"
    }
    对应该输入，一个好的可能的输出如下：
    {
        role: "ai",
        message: "我也爱你"
    }

    另一个可能的输入如下:
    [
        {
            role: "human",
            message: "我好难过"
        },
        {
            role: "ai",
            message: "没事的，一切都会好起来的"
        },
        {
            role: "human",
            message: "嗯。谢谢你"
        }
    ]
    对应该输入，一个好的可能的输出如下：
    {
        role: "ai",
        message: "我会一直陪着你"
    }
    """,
    output_type = ChatMessage,
    tools = [],
    model = MODEL_NAME,
    model_settings = ModelSettings(
        temperature = 0.3
    )
)
