from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    user_name: str = Field(..., min_length=3, max_length=50, description="The username, 3-50 characters")
    password: str = Field(..., min_length=8, max_length=128, description="The password, min 8 characters")
    role_name: str = Field(default="Farmer", min_length=1, max_length=50, description="The role name to assign")
