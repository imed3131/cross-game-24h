# 🎮 Modern Crossword Game Platform

A complete full-stack crossword game platform supporting French and Arabic languages, built with React + Express.js.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd crossword-game
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Initialize database
   npm run db:generate
   npm run db:push
   npm run db:seed
   
   # Start backend server
   npm run dev
   ```
   
   Backend will run on `http://localhost:3001`

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Start frontend development server
   npm run dev
   ```
   
   Frontend will run on `http://localhost:3000`

## 🔑 Admin Access

To access the admin panel:

1. Navigate to: `http://localhost:3000/admin-secret-2024`
2. Use credentials:
   - **Email:** `admin@crossword.com`
   - **Password:** `admin123`
   - **Secret Code:** `admin-secret-2024`

## 🎯 Features

### Player Features
- ✅ Modern, animated crossword interface
- ✅ French and Arabic language support with RTL
- ✅ Daily puzzle carousel with smooth transitions
- ✅ Interactive calendar with puzzle availability
- ✅ Real-time language validation
- ✅ Word highlighting and selection
- ✅ Completion celebration with confetti
- ✅ Progress tracking and auto-save
- ✅ Responsive design for all devices

### Admin Features
- ✅ Secure admin authentication
- ✅ Dashboard with analytics and charts
- ✅ Statistics tracking (completion rates, languages, time spent)
- ✅ Modern UI with animations
- 🔄 Puzzle creation interface (ready for implementation)
- 🔄 Puzzle management system (ready for implementation)

### Technical Features
- ✅ JWT authentication
- ✅ SQLite database with Prisma ORM
- ✅ Language validation middleware
- ✅ Modern React hooks and context
- ✅ Framer Motion animations
- ✅ TailwindCSS styling
- ✅ Auto-save game state
- ✅ Error handling and toast notifications

## 📁 Project Structure

```
crossword-game/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── index.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admin/
    │   │   ├── common/
    │   │   └── player/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    ├── package.json
    └── .env
```

## 🎨 Design Features

- **Modern Gradient Design**: Beautiful gradients and shadows throughout
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Glass Morphism**: Modern glassmorphism effects
- **RTL Support**: Full right-to-left support for Arabic content
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Accessibility**: WCAG compliant with keyboard navigation

## 🌐 API Endpoints

### Player Endpoints
- `GET /api/player/today` - Get today's puzzles
- `GET /api/player/date/:date` - Get puzzles for specific date
- `GET /api/player/dates` - Get all puzzle dates
- `POST /api/player/submit/:id` - Submit puzzle solution

### Admin Endpoints (Protected)
- `POST /api/auth/login` - Admin authentication
- `POST /api/admin/puzzle` - Create new puzzle
- `GET /api/admin/puzzle/:id` - Get specific puzzle
- `GET /api/admin/puzzles` - Get all puzzles
- `PUT /api/admin/puzzle/:id` - Update puzzle
- `DELETE /api/admin/puzzle/:id` - Delete puzzle
- `GET /api/admin/stats` - Get analytics data

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ADMIN_SECRET_CODE=admin-secret-2024
DATABASE_URL="file:./dev.db"
```

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SECRET_CODE=admin-secret-2024
```

## 🚀 Production Deployment

### Backend
1. Set production environment variables
2. Use PostgreSQL or MySQL for production database
3. Run `npm run build` (if you have a build script)
4. Deploy to your preferred platform (Heroku, DigitalOcean, etc.)

### Frontend
1. Update API URLs in environment variables
2. Run `npm run build`
3. Deploy the `dist/` folder to static hosting (Netlify, Vercel, etc.)

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS
- Framer Motion for smooth animations
- Prisma for the excellent database toolkit
- All the open-source contributors who make projects like this possible

---

**Built with ❤️ using React, Express.js, Prisma, and modern web technologies**
