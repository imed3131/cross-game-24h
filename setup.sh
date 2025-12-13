#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎮 Setting up Modern Crossword Game Platform${NC}"
echo -e "${BLUE}==============================================${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"

# Backend setup
echo -e "\n${BLUE}🔧 Setting up backend...${NC}"
cd backend

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Backend package.json not found${NC}"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend npm install failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Database setup
echo -e "\n${BLUE}🗄️  Setting up database...${NC}"
npm run db:generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database generation failed${NC}"
    exit 1
fi

npm run db:push
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database push failed${NC}"
    exit 1
fi

npm run db:seed
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database seeding failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database setup complete${NC}"

# Frontend setup
echo -e "\n${BLUE}🎨 Setting up frontend...${NC}"
cd ../frontend

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Frontend package.json not found${NC}"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend npm install failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# Go back to root
cd ..

echo -e "\n${GREEN}🎉 Setup completed successfully!${NC}"
echo -e "\n${YELLOW}🚀 To start the application:${NC}"
echo -e "${BLUE}   1. Backend:  cd backend && npm run dev${NC}"
echo -e "${BLUE}   2. Frontend: cd frontend && npm run dev${NC}"
echo -e "\n${YELLOW}🔑 Admin Access:${NC}"
echo -e "${BLUE}   URL: http://localhost:3000/admin-secret-2024${NC}"
echo -e "${BLUE}   Email: admin@crossword.com${NC}"
echo -e "${BLUE}   Password: admin123${NC}"
echo -e "${BLUE}   Secret Code: admin-secret-2024${NC}"
echo -e "\n${YELLOW}🎮 Player Access:${NC}"
echo -e "${BLUE}   URL: http://localhost:3000${NC}"

echo -e "\n${GREEN}Happy coding! 🎯${NC}"
