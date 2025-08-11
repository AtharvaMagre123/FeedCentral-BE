declare global {
  namespace Express {
    export interface Request {
      userId?: string;
    }
  }
}

import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { ContentModel, LinkModel, UserModel } from "./db";
import { JWT_SECRET } from "./config";
import { usermiddleware } from "./middleware";
import { random } from "./utils";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "https://feed-central-fe.vercel.app",
    credentials: true,
  })
);

app.post("/api/v1/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    await UserModel.create({ username: username, password: password });
    res.json({ message: "User created successfully" });
  } catch (e) {
    res.status(411).json({ message: "User already exists" });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const existinguser = await UserModel.findOne({
    username: username,
    password: password,
  });

  if (existinguser) {
    const token = jwt.sign({ id: existinguser!._id }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(403).json({ message: "Invalid username or password" });
  }
});

app.post("/api/v1/content", usermiddleware, async (req, res) => {
  const title = req.body.title;
  const link = req.body.link;
  const type = req.body.type;

  const existingContent = await ContentModel.findOne({ title, userId: req.userId });

  if (existingContent) {
    res.status(403).json({ message: "You already have content with this title" });
    return;
  }

  await ContentModel.create({ title, link, type, userId: req.userId, tags: [] });

  res.json({
    message: "Content created successfully",
  });
});

app.get("/api/v1/content", usermiddleware, async (req, res) => {
  const userId = req.userId;
  const content = await ContentModel.find({ userId: userId }).populate(
    "userId",
    "username"
  );
  res.json({ content });
});

app.delete("/api/v1/content", usermiddleware, async (req, res) => {
  const title = req.body.title;
  await ContentModel.deleteMany({
    title,

    userId: req.userId,
  });
  res.json({ message: "Content deleted successfully" });
});

app.post("/api/v1/brain/share", usermiddleware, async (req, res) => {
  const share = req.body.share;

  if (share) {
    const existingLink = await LinkModel.findOne({ userId: req.userId });

    if (existingLink) {
      res.json({
        message: existingLink.hash,
      });
    }
    const hash = random(10);
    await LinkModel.create({
      userId: req.userId,
      hash: hash,
    });

    res.json({
      message: hash,
    });
  } else {
    await LinkModel.deleteOne({ userId: req.userId });
  }
  res.json({ message: "Removed successfully" });
});

app.get("/api/v1/brain/share/:shareLink", async (req, res) => {
  const hash = req.params.shareLink;

  const link = await LinkModel.findOne({ hash });

  if (!link) {
    res.status(411).json({ message: "Sorry incorrect input" });
    return;
  }

  const content = await ContentModel.find({ userId: link.userId });

  const user = await UserModel.findOne({ _id: link.userId });

  if (!user) {
    res.status(411).json({ message: "User not found" });
    return;
  }

  res.json({
    username: user.username,
    content: content,
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
