import express from "express";
import {
    getAllTransactions,
    createTransaction,
    updateTransactionStatus,
    deleteTransaction,
} from "../controllers/transaction.controller.js";

const router = express.Router();

router.get("/", getAllTransactions);
router.post("/", createTransaction);
router.put("/:id", updateTransactionStatus);
router.delete("/:id", deleteTransaction);

export default router;
