# -*- coding: utf-8 -*-
"""
Billing and credit management endpoints.
"""

from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel

from app.core.config import settings
from app.api.endpoints.auth import get_current_user

router = APIRouter()


# Pydantic models
class CreditPackage(BaseModel):
    id: str
    name: str
    credits: int
    price_cents: int
    price_display: str
    savings_percent: Optional[int] = None
    popular: bool = False


class PurchaseRequest(BaseModel):
    package_id: str
    payment_method_id: Optional[str] = None


class PurchaseResponse(BaseModel):
    success: bool
    transaction_id: str
    credits_added: int
    new_balance: int
    receipt_url: Optional[str] = None


class TransactionRecord(BaseModel):
    id: str
    type: str  # purchase, usage, refund, bonus
    credits: int
    balance_after: int
    description: str
    created_at: datetime
    project_id: Optional[str] = None
    amount_cents: Optional[int] = None


class UsageStats(BaseModel):
    total_credits_purchased: int
    total_credits_used: int
    credits_remaining: int
    projects_calculated: int
    avg_credits_per_project: float


# Credit packages
CREDIT_PACKAGES = [
    CreditPackage(
        id="starter",
        name="Starter Pack",
        credits=10,
        price_cents=900,
        price_display="$9.00",
    ),
    CreditPackage(
        id="professional",
        name="Professional Pack",
        credits=50,
        price_cents=4000,
        price_display="$40.00",
        savings_percent=11,
        popular=True,
    ),
    CreditPackage(
        id="enterprise",
        name="Enterprise Pack",
        credits=200,
        price_cents=14000,
        price_display="$140.00",
        savings_percent=30,
    ),
    CreditPackage(
        id="unlimited",
        name="Unlimited Monthly",
        credits=9999,
        price_cents=9900,
        price_display="$99.00/month",
    ),
]

# Mock transaction store
_transactions_store: List[dict] = []


@router.get("/packages", response_model=List[CreditPackage])
async def get_credit_packages():
    """
    Get available credit packages for purchase.
    """
    return CREDIT_PACKAGES


@router.get("/balance")
async def get_balance(current_user: dict = Depends(get_current_user)):
    """
    Get current credit balance.
    """
    return {
        "credits": current_user["credits"],
        "user_id": current_user["id"],
    }


@router.post("/purchase", response_model=PurchaseResponse)
async def purchase_credits(
    request: PurchaseRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Purchase credits using Stripe.

    In production, this integrates with Stripe for payment processing.
    """
    # Find package
    package = next((p for p in CREDIT_PACKAGES if p.id == request.package_id), None)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid package ID",
        )

    # In production: Process payment with Stripe
    # stripe.PaymentIntent.create(...)

    # Mock successful payment
    transaction_id = str(uuid.uuid4())
    new_balance = current_user["credits"] + package.credits

    # Record transaction
    transaction = {
        "id": transaction_id,
        "user_id": current_user["id"],
        "type": "purchase",
        "credits": package.credits,
        "balance_after": new_balance,
        "description": f"Purchased {package.name} ({package.credits} credits)",
        "created_at": datetime.utcnow(),
        "amount_cents": package.price_cents,
    }
    _transactions_store.append(transaction)

    # Update user balance (in production: update database)
    # current_user["credits"] = new_balance

    return PurchaseResponse(
        success=True,
        transaction_id=transaction_id,
        credits_added=package.credits,
        new_balance=new_balance,
    )


@router.post("/create-checkout-session")
async def create_checkout_session(
    request: PurchaseRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a Stripe checkout session for credit purchase.
    """
    package = next((p for p in CREDIT_PACKAGES if p.id == request.package_id), None)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid package ID",
        )

    # In production: Create Stripe checkout session
    # session = stripe.checkout.Session.create(...)

    # Mock response
    return {
        "checkout_url": f"https://checkout.stripe.com/mock/{package.id}",
        "session_id": str(uuid.uuid4()),
    }


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events.

    Processes payment confirmations and updates credit balances.
    """
    # In production: Verify webhook signature
    # payload = await request.body()
    # sig_header = request.headers.get("stripe-signature")
    # event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)

    # Handle different event types
    # if event.type == "checkout.session.completed":
    #     # Add credits to user account
    #     pass

    return {"received": True}


@router.get("/transactions", response_model=List[TransactionRecord])
async def get_transactions(
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
):
    """
    Get credit transaction history.
    """
    user_transactions = [
        t for t in _transactions_store
        if t.get("user_id") == current_user["id"]
    ]

    # Sort by date descending
    user_transactions.sort(key=lambda x: x["created_at"], reverse=True)

    # Paginate
    paginated = user_transactions[offset:offset + limit]

    return [TransactionRecord(**t) for t in paginated]


@router.get("/usage", response_model=UsageStats)
async def get_usage_stats(current_user: dict = Depends(get_current_user)):
    """
    Get credit usage statistics.
    """
    user_transactions = [
        t for t in _transactions_store
        if t.get("user_id") == current_user["id"]
    ]

    total_purchased = sum(t["credits"] for t in user_transactions if t["type"] == "purchase")
    total_used = abs(sum(t["credits"] for t in user_transactions if t["type"] == "usage"))
    projects = len([t for t in user_transactions if t["type"] == "usage"])

    return UsageStats(
        total_credits_purchased=total_purchased,
        total_credits_used=total_used,
        credits_remaining=current_user["credits"],
        projects_calculated=projects,
        avg_credits_per_project=total_used / projects if projects > 0 else 0,
    )


@router.post("/redeem")
async def redeem_promo_code(
    code: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Redeem a promotional code for free credits.
    """
    # Mock promo codes
    promo_codes = {
        "WELCOME2024": 5,
        "HVACPRO": 10,
        "ASHRAE": 15,
    }

    if code.upper() not in promo_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired promo code",
        )

    credits = promo_codes[code.upper()]
    new_balance = current_user["credits"] + credits

    # Record transaction
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": "bonus",
        "credits": credits,
        "balance_after": new_balance,
        "description": f"Promo code redeemed: {code.upper()}",
        "created_at": datetime.utcnow(),
    }
    _transactions_store.append(transaction)

    return {
        "success": True,
        "credits_added": credits,
        "new_balance": new_balance,
        "message": f"Successfully redeemed {credits} credits!",
    }
