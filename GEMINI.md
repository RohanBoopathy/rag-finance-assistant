# Project Overview 

## About the project

QueriFy is a RAG (Retrieval-Augmented Generation) based finance assistant app that helps people to keep track of their back accounts and financial data in a single with interactive dashboard, transactions history and a AI chat area to ask queries related to their finance and recommend better techniques to maintain and achieve their long/short terms.

## Initial Idea and Implementation

The project's initial idea and currently implemented phase is to store user details, user transactionss, ai conservations and messages in a mongodb cloud. Then the transacions are ingested to qdrant vector, which runs with the help of docker. The Ollama qwen model retrieves from the Qdrant for vector embedded data to respond human queries.

## Current Idea and to be implemented

But now the idea is changed to store both (user details, transactions, conversations) and (vector emmbeddings) in SUPABASE. From where the Ollama model retrieves data and answers user queries.

## Tech Stack
Next.js - 16+
Tailwind CSS - v4
express - 5+