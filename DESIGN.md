# VN Invest — Technical & System Architecture Specification

## Overview

VN Invest is a quantitative equity recommendation and market analysis system for the Vietnam Stock Market (HOSE, HNX, UPCoM). It follows a strictly separated architecture:

```
Python Quantitative Engine -> Validated Data Contract -> Static JSON Artifacts -> React / TanStack Router -> SSG / GitHub Pages
```

## System Architecture

```
                 ┌─────────────────────┐
                 │  VN Market Sources  │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ Python Data Provider│
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ Quantitative Engine │
                 │ Indicators          │
                 │ Regime              │
                 │ Alpha               │
                 │ Risk                │
                 │ Trade Plan          │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ JSON Schema         │
                 │ Validation          │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ Static JSON         │
                 │ Artifacts           │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ React / TanStack    │
                 │ Router              │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ SSG / GitHub Pages  │
                 └─────────────────────┘
```

## Core Principles

1. **Python is the Single Source of Truth**: All calculations (Alpha score, Risk metrics, Stop Loss, Take Profit, Regime detection, Technical indicators) are strictly computed in Python.
2. **Presentation-only Frontend**: React only renders generated static JSON artifacts. No runtime calculation or runtime data API requests happen on the client.
3. **Data Contract Enforcement**: `schemas/recommendations.schema.json` defines the canonical schema. Python output is validated before atomic write, and TypeScript interfaces (`src/types/recommendation.ts`) strictly mirror the schema.
4. **Canonical Price Units**: All backend price values are represented in VNĐ/share. Frontend utilities (`src/lib/format.ts`) format values for display.
5. **Static Site Generation (SSG)**: TanStack Start / Vite builds and prerenders static routes (`/`, `/history`, `/stock/$symbol`) for instant loading and GitHub Pages deployment.
