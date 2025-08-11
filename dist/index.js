"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const utils_1 = require("./utils");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    try {
        yield db_1.UserModel.create({ username: username, password: password });
        res.json({ message: "User created successfully" });
    }
    catch (e) {
        res.status(411).json({ message: "User already exists" });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    const existinguser = yield db_1.UserModel.findOne({
        username: username,
        password: password,
    });
    if (existinguser) {
        const token = jsonwebtoken_1.default.sign({ id: existinguser._id }, config_1.JWT_SECRET);
        res.json({ token });
    }
    else {
        res.status(403).json({ message: "Invalid username or password" });
    }
}));
app.post("/api/v1/content", middleware_1.usermiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const title = req.body.title;
    const link = req.body.link;
    const type = req.body.type;
    const existingContent = yield db_1.ContentModel.findOne({ title, userId: req.userId });
    if (existingContent) {
        res.status(403).json({ message: "You already have content with this title" });
        return;
    }
    yield db_1.ContentModel.create({ title, link, type, userId: req.userId, tags: [] });
    res.json({
        message: "Content created successfully",
    });
}));
app.get("/api/v1/content", middleware_1.usermiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const content = yield db_1.ContentModel.find({ userId: userId }).populate("userId", "username");
    res.json({ content });
}));
app.delete("/api/v1/content", middleware_1.usermiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const title = req.body.title;
    yield db_1.ContentModel.deleteMany({
        title,
        userId: req.userId,
    });
    res.json({ message: "Content deleted successfully" });
}));
app.post("/api/v1/brain/share", middleware_1.usermiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    if (share) {
        const existingLink = yield db_1.LinkModel.findOne({ userId: req.userId });
        if (existingLink) {
            res.json({
                message: existingLink.hash,
            });
        }
        const hash = (0, utils_1.random)(10);
        yield db_1.LinkModel.create({
            userId: req.userId,
            hash: hash,
        });
        res.json({
            message: hash,
        });
    }
    else {
        yield db_1.LinkModel.deleteOne({ userId: req.userId });
    }
    res.json({ message: "Removed successfully" });
}));
app.get("/api/v1/brain/share/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.shareLink;
    const link = yield db_1.LinkModel.findOne({ hash });
    if (!link) {
        res.status(411).json({ message: "Sorry incorrect input" });
        return;
    }
    const content = yield db_1.ContentModel.find({ userId: link.userId });
    const user = yield db_1.UserModel.findOne({ _id: link.userId });
    if (!user) {
        res.status(411).json({ message: "User not found" });
        return;
    }
    res.json({
        username: user.username,
        content: content,
    });
}));
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
