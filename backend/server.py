from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class ProductVariant(BaseModel):
    color: str
    color_code: str
    images: List[str] = []  # base64 images

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: str  # sarees, dress_materials, readymade_dresses
    subcategory: Optional[str] = None
    sizes: List[str] = ["S", "M", "L", "XL"]
    variants: List[ProductVariant] = []
    main_image: str = ""  # base64 image
    fabric: Optional[str] = None
    occasion: Optional[str] = None
    is_featured: bool = False
    is_new_arrival: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: str
    subcategory: Optional[str] = None
    sizes: List[str] = ["S", "M", "L", "XL"]
    variants: List[ProductVariant] = []
    main_image: str = ""
    fabric: Optional[str] = None
    occasion: Optional[str] = None
    is_featured: bool = False
    is_new_arrival: bool = False

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    product_image: str
    price: float
    size: str
    color: str
    quantity: int = 1
    added_at: datetime = Field(default_factory=datetime.utcnow)

class CartItemCreate(BaseModel):
    product_id: str
    product_name: str
    product_image: str
    price: float
    size: str
    color: str
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

# Product Routes
@api_router.get("/")
async def root():
    return {"message": "Welcome to Vastrakala API"}

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None, new_arrival: Optional[bool] = None):
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["is_featured"] = featured
    if new_arrival is not None:
        query["is_new_arrival"] = new_arrival
    
    products = await db.products.find(query).to_list(100)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# Cart Routes
@api_router.get("/cart", response_model=List[CartItem])
async def get_cart():
    items = await db.cart.find().to_list(100)
    return [CartItem(**item) for item in items]

@api_router.post("/cart", response_model=CartItem)
async def add_to_cart(item: CartItemCreate):
    # Check if same product with same size and color exists
    existing = await db.cart.find_one({
        "product_id": item.product_id,
        "size": item.size,
        "color": item.color
    })
    
    if existing:
        # Update quantity
        new_quantity = existing["quantity"] + item.quantity
        await db.cart.update_one(
            {"id": existing["id"]},
            {"$set": {"quantity": new_quantity}}
        )
        existing["quantity"] = new_quantity
        return CartItem(**existing)
    
    item_dict = item.dict()
    item_obj = CartItem(**item_dict)
    await db.cart.insert_one(item_obj.dict())
    return item_obj

@api_router.put("/cart/{item_id}", response_model=CartItem)
async def update_cart_item(item_id: str, update: CartItemUpdate):
    result = await db.cart.find_one_and_update(
        {"id": item_id},
        {"$set": {"quantity": update.quantity}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return CartItem(**result)

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str):
    result = await db.cart.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart():
    await db.cart.delete_many({})
    return {"message": "Cart cleared"}

# Seed sample products
@api_router.post("/seed")
async def seed_products():
    # Check if products already exist
    count = await db.products.count_documents({})
    if count > 0:
        return {"message": f"Products already seeded. {count} products exist."}
    
    sample_products = [
        # Sarees
        {
            "name": "Banarasi Silk Saree",
            "description": "Exquisite Banarasi silk saree with intricate gold zari work. Perfect for weddings and festive occasions.",
            "price": 12999,
            "original_price": 15999,
            "category": "sarees",
            "subcategory": "silk",
            "sizes": ["Free Size"],
            "variants": [
                {"color": "Maroon", "color_code": "#800000", "images": []},
                {"color": "Royal Blue", "color_code": "#4169E1", "images": []},
                {"color": "Emerald Green", "color_code": "#50C878", "images": []}
            ],
            "fabric": "Pure Silk",
            "occasion": "Wedding",
            "is_featured": True,
            "is_new_arrival": False
        },
        {
            "name": "Kanjivaram Silk Saree",
            "description": "Traditional Kanjivaram silk saree with temple border design. A timeless classic for special occasions.",
            "price": 18999,
            "original_price": 22999,
            "category": "sarees",
            "subcategory": "silk",
            "sizes": ["Free Size"],
            "variants": [
                {"color": "Red", "color_code": "#DC143C", "images": []},
                {"color": "Purple", "color_code": "#800080", "images": []}
            ],
            "fabric": "Pure Silk",
            "occasion": "Wedding",
            "is_featured": True,
            "is_new_arrival": True
        },
        {
            "name": "Chiffon Printed Saree",
            "description": "Lightweight chiffon saree with beautiful floral prints. Ideal for daily wear and casual gatherings.",
            "price": 2499,
            "original_price": 3499,
            "category": "sarees",
            "subcategory": "chiffon",
            "sizes": ["Free Size"],
            "variants": [
                {"color": "Pink", "color_code": "#FF69B4", "images": []},
                {"color": "Yellow", "color_code": "#FFD700", "images": []},
                {"color": "Peach", "color_code": "#FFDAB9", "images": []}
            ],
            "fabric": "Chiffon",
            "occasion": "Casual",
            "is_featured": False,
            "is_new_arrival": True
        },
        {
            "name": "Cotton Handloom Saree",
            "description": "Comfortable cotton handloom saree with traditional motifs. Perfect for office and daily wear.",
            "price": 1899,
            "original_price": 2499,
            "category": "sarees",
            "subcategory": "cotton",
            "sizes": ["Free Size"],
            "variants": [
                {"color": "White", "color_code": "#FFFFFF", "images": []},
                {"color": "Beige", "color_code": "#F5F5DC", "images": []}
            ],
            "fabric": "Cotton",
            "occasion": "Daily Wear",
            "is_featured": False,
            "is_new_arrival": False
        },
        # Dress Materials
        {
            "name": "Embroidered Chanderi Suit",
            "description": "Elegant Chanderi cotton suit with beautiful thread embroidery. Includes top, bottom and dupatta.",
            "price": 3999,
            "original_price": 4999,
            "category": "dress_materials",
            "subcategory": "chanderi",
            "sizes": ["Unstitched"],
            "variants": [
                {"color": "Lavender", "color_code": "#E6E6FA", "images": []},
                {"color": "Mint Green", "color_code": "#98FF98", "images": []},
                {"color": "Powder Blue", "color_code": "#B0E0E6", "images": []}
            ],
            "fabric": "Chanderi Cotton",
            "occasion": "Festive",
            "is_featured": True,
            "is_new_arrival": True
        },
        {
            "name": "Printed Lawn Suit",
            "description": "Premium lawn cotton suit with digital prints. Soft fabric perfect for summer.",
            "price": 2499,
            "original_price": 3299,
            "category": "dress_materials",
            "subcategory": "cotton",
            "sizes": ["Unstitched"],
            "variants": [
                {"color": "Coral", "color_code": "#FF7F50", "images": []},
                {"color": "Teal", "color_code": "#008080", "images": []}
            ],
            "fabric": "Lawn Cotton",
            "occasion": "Casual",
            "is_featured": False,
            "is_new_arrival": True
        },
        {
            "name": "Silk Jacquard Suit",
            "description": "Luxurious silk jacquard suit with rich texture. Perfect for weddings and parties.",
            "price": 6999,
            "original_price": 8999,
            "category": "dress_materials",
            "subcategory": "silk",
            "sizes": ["Unstitched"],
            "variants": [
                {"color": "Wine", "color_code": "#722F37", "images": []},
                {"color": "Navy Blue", "color_code": "#000080", "images": []}
            ],
            "fabric": "Silk Jacquard",
            "occasion": "Wedding",
            "is_featured": True,
            "is_new_arrival": False
        },
        # Readymade Dresses
        {
            "name": "Anarkali Gown",
            "description": "Stunning floor-length Anarkali gown with embellished bodice. Perfect for sangeet and reception.",
            "price": 8999,
            "original_price": 11999,
            "category": "readymade_dresses",
            "subcategory": "anarkali",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "variants": [
                {"color": "Burgundy", "color_code": "#800020", "images": []},
                {"color": "Teal", "color_code": "#008080", "images": []},
                {"color": "Dusty Pink", "color_code": "#D4A5A5", "images": []}
            ],
            "fabric": "Georgette",
            "occasion": "Party",
            "is_featured": True,
            "is_new_arrival": True
        },
        {
            "name": "Palazzo Suit Set",
            "description": "Trendy kurta with palazzo pants and dupatta. Comfortable and stylish for all occasions.",
            "price": 3499,
            "original_price": 4499,
            "category": "readymade_dresses",
            "subcategory": "palazzo_set",
            "sizes": ["S", "M", "L", "XL"],
            "variants": [
                {"color": "Mustard", "color_code": "#FFDB58", "images": []},
                {"color": "Olive", "color_code": "#808000", "images": []},
                {"color": "Rust", "color_code": "#B7410E", "images": []}
            ],
            "fabric": "Rayon",
            "occasion": "Casual",
            "is_featured": False,
            "is_new_arrival": True
        },
        {
            "name": "Sharara Set",
            "description": "Elegant short kurta with flared sharara pants. Traditional yet contemporary design.",
            "price": 5999,
            "original_price": 7499,
            "category": "readymade_dresses",
            "subcategory": "sharara",
            "sizes": ["S", "M", "L", "XL"],
            "variants": [
                {"color": "Peach", "color_code": "#FFDAB9", "images": []},
                {"color": "Sage Green", "color_code": "#9DC183", "images": []}
            ],
            "fabric": "Silk Blend",
            "occasion": "Festive",
            "is_featured": True,
            "is_new_arrival": False
        },
        {
            "name": "Cotton Kurti",
            "description": "Simple and elegant cotton kurti with block print. Perfect for everyday wear.",
            "price": 999,
            "original_price": 1499,
            "category": "readymade_dresses",
            "subcategory": "kurti",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "variants": [
                {"color": "Indigo", "color_code": "#4B0082", "images": []},
                {"color": "Maroon", "color_code": "#800000", "images": []},
                {"color": "Black", "color_code": "#000000", "images": []}
            ],
            "fabric": "Cotton",
            "occasion": "Daily Wear",
            "is_featured": False,
            "is_new_arrival": False
        },
        {
            "name": "Designer Lehenga",
            "description": "Stunning bridal lehenga with heavy embroidery and sequin work. A showstopper for your special day.",
            "price": 35999,
            "original_price": 45999,
            "category": "readymade_dresses",
            "subcategory": "lehenga",
            "sizes": ["S", "M", "L", "XL"],
            "variants": [
                {"color": "Red", "color_code": "#FF0000", "images": []},
                {"color": "Magenta", "color_code": "#FF00FF", "images": []},
                {"color": "Gold", "color_code": "#FFD700", "images": []}
            ],
            "fabric": "Velvet & Net",
            "occasion": "Bridal",
            "is_featured": True,
            "is_new_arrival": True
        }
    ]
    
    for product_data in sample_products:
        product = Product(**product_data)
        await db.products.insert_one(product.dict())
    
    return {"message": f"Successfully seeded {len(sample_products)} products"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
