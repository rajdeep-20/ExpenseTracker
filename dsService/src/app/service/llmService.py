from typing import Optional
import os
import logging
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_mistralai import ChatMistralAI
from app.service.Expense import Expense
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


class LLMService:
    
    def __init__(self):
        load_dotenv()
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are an expert extraction algorithm. "
                    "Only extract relevant information from the text. "
                    "If you do not know the value of an attribute asked to extract, "
                    "return null for the attribute's value.",

                ),
                ("human", "{text}")
            ]
        )
        
        self.apiKey = os.getenv("MISTRAL_API_KEY")
        if not self.apiKey:
            raise ValueError("MISTRAL_API_KEY environment variable is not set")
        self.llm = ChatMistralAI(api_key=self.apiKey, model="mistral-large-latest", temperature=0.0)
        self.runnable = self.prompt | self.llm.with_structured_output(schema=Expense)
        
        
    def runLLM(self, message):
        try:
            return self.runnable.invoke({"text": message})
        except Exception as e:
            logger.error(f"LLM invocation failed: {e}")
            raise