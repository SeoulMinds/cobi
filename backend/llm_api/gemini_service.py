"""Gemini LLM service for shopping assistant using LangChain."""

import os
import asyncio
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage

from .prompts import SHOPPING_ASSISTANT_SYSTEM_PROMPT, create_user_message_with_context


class GeminiService:
    """Service class for interacting with Gemini AI via LangChain."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash", max_retries: int = 3):
        """
        Initialize Gemini service.

        Args:
            api_key: Google API key. If None, reads from GEMINI_API_KEY env var
            model: Model name to use (default: gemini-1.5-flash for speed)
                  Options: gemini-1.5-flash, gemini-1.5-pro
            max_retries: Maximum number of retries for empty responses (default: 3)
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment or not provided")

        self.model = model
        self.max_retries = max_retries
        self.llm = self._initialize_llm()

    def _initialize_llm(self) -> ChatGoogleGenerativeAI:
        """Initialize the LangChain Gemini chat model."""
        return ChatGoogleGenerativeAI(
            model=self.model,
            google_api_key=self.api_key,
            temperature=0.7,  # Balance between creativity and consistency
            max_output_tokens=500,  # Limit response length
            convert_system_message_to_human=True,  # Gemini requires this
        )

    async def generate_response(
        self,
        user_query: str,
        product_context: Optional[str] = None,
        conversation_history: Optional[list] = None,
    ) -> str:
        """
        Generate a response to user query using Gemini.

        Args:
            user_query: The user's message/question
            product_context: Optional product information to provide context
            conversation_history: Optional list of previous messages for context

        Returns:
            AI-generated response as a string
        """
        for attempt in range(self.max_retries):
            try:
                # Build messages list
                messages = []

                # Add system prompt (converted to human message by LangChain)
                messages.append(SystemMessage(content=SHOPPING_ASSISTANT_SYSTEM_PROMPT))

                # Add conversation history if provided
                if conversation_history:
                    messages.extend(conversation_history)

                # Add current user query with optional product context
                user_message = create_user_message_with_context(user_query, product_context)
                messages.append(HumanMessage(content=user_message))

                # Generate response
                response = await self.llm.ainvoke(messages)
                response_content = response.content.strip() if response.content else ""

                # Check if response is empty
                if not response_content:
                    if attempt < self.max_retries - 1:
                        print(
                            f"⚠️  Received empty response from Gemini "
                            f"(attempt {attempt + 1}/{self.max_retries})"
                        )
                        # Wait before retrying with exponential backoff
                        wait_time = 2 ** attempt  # 1s, 2s, 4s...
                        print(f"   Retrying in {wait_time} seconds...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        # All retries exhausted, return fallback
                        print(
                            "ℹ️  All retry attempts completed. "
                            "Using fallback response for better UX."
                        )
                        return self._get_fallback_response(user_query)

                return response_content

            except Exception as e:
                # Log error and return user-friendly message
                error_msg = (
                    f"⚠️  Error generating response "
                    f"(attempt {attempt + 1}/{self.max_retries}): {str(e)}"
                )
                print(error_msg)
                if attempt < self.max_retries - 1:
                    # Wait before retrying with exponential backoff
                    wait_time = 2 ** attempt
                    print(f"   Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    print(
                        "ℹ️  All retry attempts completed. "
                        "Using fallback response for better UX."
                    )
                    return self._get_fallback_response(user_query)

        # Should not reach here, but just in case
        return self._get_fallback_response(user_query)

    def _get_fallback_response(self, user_query: str) -> str:
        """Provide a fallback response when Gemini fails."""
        # Check if query is about product availability or stock
        query_lower = user_query.lower()
        stock_keywords = [
            'stock', 'available', 'in stock', 'buy', 'purchase', 'get'
        ]
        if any(keyword in query_lower for keyword in stock_keywords):
            return (
                "I apologize, but I'm currently unable to check our "
                "inventory status. Our stock information may be temporarily "
                "unavailable. Please check back in a few moments, or contact "
                "our support team for immediate assistance!"
            )
        
        # General fallback for other queries
        return (
            "I'm currently experiencing some difficulty accessing "
            "information to help you with that. Feel free to browse our "
            "products directly, or try asking me again in a moment. "
            "I'm here to help!"
        )

    async def simple_chat(self, user_query: str) -> str:
        """
        Simple chat without product context (for basic queries).

        Args:
            user_query: The user's message

        Returns:
            AI-generated response
        """
        return await self.generate_response(user_query)


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service(api_key: Optional[str] = None) -> Optional[GeminiService]:
    """
    Get or create the Gemini service singleton.

    Args:
        api_key: Optional API key override

    Returns:
        GeminiService instance or None if API key not available
    """
    global _gemini_service

    if _gemini_service is None:
        try:
            _gemini_service = GeminiService(api_key=api_key)
        except ValueError as e:
            print(f"Failed to initialize Gemini service: {e}")
            return None

    return _gemini_service
