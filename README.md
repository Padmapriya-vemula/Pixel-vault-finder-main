# 🖼️ Photo Vault

Pixel Vault Finder is a **React-based Image Storage and Retrieval Web Application** using React framework powered by **Node.js** and **AWS S3**.  
The application allows users to **upload images** and **search them efficiently** through **AI-generated keyword tagging**.  
By deep image scanning, the app uses **keyword assignment technology** that tags uploaded images with relevant descriptive keywords — enabling **fast and advanced in-app searches**.

---
## 🚀 Features

- 🔐 **User Register/Login** — Register and login system allowing users to access their personalized image storage and searches.
- 📤 **Image Upload** — Upload any image through a clean, user-friendly interface.  
- 🧠 **Keyword Tagging** — Automatically assigns meaningful keywords to images for better retrieval.  
- 🔍 **Advanced Search** — Search using descriptive terms like “mountain”, “t-shirt”, “laptop”, etc.  
- 🖼️ **Grid Display** — Displays images in a responsive grid layout.   
- ⚡ **Fast Frontend** — Built using React (Vite) and styled with TailwindCSS for speed and simplicity.

---

## 🧩 Tech Stack

**Frontend:**  
- React (Vite)  
- TypeScript  
- Tailwind CSS  

**Backend:**   
- Keyword Tagging API or logic for assigning searchable tags
- Node.js

**Storage:**  
- AWS S3 

---
## Screenshots/Images
![Create account page](https://github.com/Padmapriya-vemula/pixel-vault-finder/blob/46f572e08c0e2832577d388f27f7842a86b485a3/Screenshot%202025-11-04%20173526.png)
![Login page](https://github.com/Padmapriya-vemula/pixel-vault-finder/blob/46f572e08c0e2832577d388f27f7842a86b485a3/Screenshot%202025-11-04%20173513.png)
![Home page](https://github.com/Padmapriya-vemula/pixel-vault-finder/blob/46f572e08c0e2832577d388f27f7842a86b485a3/Screenshot%202025-11-04%20173501.png)
![Features](https://github.com/Padmapriya-vemula/pixel-vault-finder/blob/46f572e08c0e2832577d388f27f7842a86b485a3/Screenshot%202025-11-04%20173442.png).

## 🛠️ Getting Started

Follow the steps below to set up and run the project locally.

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Padmapriya-vemula/pixel-vault-finder.git
cd pixel-vault-finder
```

### 2️⃣ Install Dependencies
```bash
Make sure you have Node.js (>= 18) installed.

npm install
```

or if you are using Bun:
```bash
bun install
```
## 3️⃣ Setup Environment Variables

Create a .env file in the root directory and add your environment configuration:
```bash
VITE_API_URL=http://localhost:5000
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
VITE_S3_BUCKET_NAME=your_s3_bucket_name
VITE_REGION=your_aws_region
```

⚠️ Do not commit your .env file to the repository.

## 4️⃣ Run the Development Server
```bash
npm run dev
```
## Run the Backend Server
```bash
npm run dev:api
```

Your app will be available at:
👉 http://localhost:3001

## 📦 Build for Production

To create an optimized production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```
## ☁️ Deployment

* Frontend Deployment Options:

* Vercel

* Netlify

* AWS S3 Static Website Hosting

* Backend Deployment Options:

* Render

* AWS EC2

* Railway

## 🧠 How It Works

1. User Register/login and uploads an image through the web interface.

2. The system automatically assigns relevant keywords to the image (e.g., “beach”, “car”, “city”).

3. The image and its keywords are stored in AWS S3 and metadata in the database.

4. During search, keywords entered by the user are matched against stored tags for quick retrieval.

5. Matching images are displayed in a clean, responsive grid layout.

## 🤝 Contribution Guidelines

We welcome contributions to improve Pixel Vault Finder!

**Fork this repository.**

**Create a new branch:**
```bash
git checkout -b feature/your-feature-name
```

**Make your changes and commit:**
```bash
git commit -m "Added feature: your-feature-name"
```

**Push the branch:**
```bash
git push origin feature/your-feature-name
```

Open a Pull Request with a clear description of your updates.

## 🧭 Future Enhancements

* Add authentication and user profiles

* Integrate image categorization by themes

* Enable drag-and-drop upload support

* Add infinite scrolling for gallery view

* Support keyword editing and management

## 🏆 Author

Project: Photo Vault
Developer: [Vemula Padma Priya]
GitHub: https://github.com/Padmapriya-vemula/

Email: [vpp2210@gmail.com]
