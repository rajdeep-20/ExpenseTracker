
from typing import Optional
from pydantic import BaseModel, Field


class Expense(BaseModel):
    """
    Information about a transaction made on any card
    """
    
    amount : Optional[str] = Field(default=None, title="Amount", description="Expense made on the transaction")
    merchant : Optional[str] = Field(default=None, title="Merchant", description="Merchant name whom the transaction has been made")
    currency : Optional[str] = Field(default=None, title="Currency", description="Currency of the expense")
    
    
    def serialize(self):
        return{
            "amount": self.amount,
            "merchant": self.merchant,
            "currency": self.currency
        }