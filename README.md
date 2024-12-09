# Multi-Level Referral and Earning System Documentation

## 1. System Overview
The system is designed to enable users to:
1. Refer up to 8 people directly in a multi-level referral hierarchy.
2. Distribute earnings based on transactions:
   - **Direct referrals**: 5% of transaction profits.
   - **Indirect referrals**: 1% of transaction profits (profits from second-level users).
3. Real-time updates: Notify users of their earnings through WebSockets.

## 2. System Architecture
### Backend:
- **Technology**: Node.js with Express.js
- **Database**: SQLite using Sequelize ORM
- **Features**:
  - Multi-level referral hierarchy.
  - Real-time WebSocket notifications using `socket.io`.

### Frontend:
- **Technology**: React.js (optional HTML/JS frontend available).
- **Features**:
  - Register users.
  - Add transactions.
  - Fetch user earnings, earnings reports, and distributions.
  - Real-time updates via WebSockets.

## 3. Backend API Endpoints

### 3.1 User Management

#### Register a User
- **Endpoint**: `POST /register`
- **Description**: Registers a new user and assigns them to the referral hierarchy.
- **Request Body**:
  ```json
  {
      "name": "Alice",
      "parentId": 1 // Optional
  }
- **Response**:
    ```json
    {
        "message": "User registered successfully",
        "userId": 2
    }

#### Delete a User
- **Endpoint**: `DELETE /user/:userId`
- **Description**: Deletes a user and removes all associated transactions and earnings.
- **Request Params**:
userId (integer): The ID of the user to delete.
- **Response**:
    ```json
    {
        "message": "User with ID 2 deleted successfully"
    }

#### Transactions
##### Add a Transaction
- **Endpoint**: `POST /transaction`
- **Description**: Records a transaction, calculates profits, and updates earnings for parent and grandparent users.
- **Request Body**:
    ```json
    {
        "userId": 3,
        "amount": 1500
    }
- **Response**:
    ```json
    {
        "message": "Transaction recorded successfully"
    }

#### Earnings and Reports
##### Fetch Earnings
- **Endpoint**: `GET /earnings/:userId`
- **Description**: Fetches the total direct and indirect earnings for a user.
- **Request Params**:
userId (integer): The ID of the user.
- **Response**:
    ```json
    {
        "userId": 1,
        "totalDirectEarnings": 150,
        "totalIndirectEarnings": 15
    }

#### Fetch Earnings Report
- **Endpoint**: `GET /report/earnings/:userId`
- **Description**: Fetches detailed earnings and referral information for a user.
- **Request Params**:
userId (integer): The ID of the user.
- **Response**:
    ```json
    {
        "userId": 1,
        "name": "Alice",
        "totalDirectEarnings": 150,
        "totalIndirectEarnings": 15,
        "directReferrals": [
            { "id": 2, "name": "Bob" },
            { "id": 3, "name": "Charlie" }
        ]
    }

#### Fetch Distribution Report
- **Endpoint**: `GET /report/distribution/:userId`
- **Description**: Fetches a breakdown of referral-based earnings.
- **Request Params**:
userId (integer): The ID of the user.
- **Response**:
    ```json
    {
        "totalEarnings": 165,
        "sources": [
            {
                "userId": 2,
                "amount": 1500,
                "profitEarned": 75
            },
            {
                "userId": 3,
                "amount": 1500,
                "profitEarned": 15
            }
        ]
    }


## 4. Frontend Usage (React)
### Main Features
#### 1. Register Users:
- Enter a name and (optional) parent ID to register a user.
#### 2. Add Transactions:
- Provide a user ID and transaction amount to record a transaction.
#### 3. Delete Users:
- Enter a user ID to delete the user and associated data.
#### 4. Fetch Earnings:
- Enter a user ID to view the total direct and indirect earnings.
#### 5. Real-Time Updates:
- Receive live updates for earnings changes via WebSocket events.


## 5. Database Schema
### 1. Users Table
- Stores user information and referral hierarchy.
#### Columns:
- id: Primary key (integer).
- name: Name of the user (string).
- parentId: Parent user's ID (integer, nullable).
- level: Referral level (integer).
- isActive: Boolean for user activity (default: true).
### 2. Transactions Table
- Stores transactions and profits for each user.
#### Columns:
- id: Primary key (integer).
- userId: ID of the user making the transaction (integer).
- amount: Transaction amount (float).
- parentId: ID of the user receiving profit (integer).
- profitEarned: Profit earned from the transaction (float).
- profitPercentage: Percentage profit (float).
### 3. Earnings Table
- Stores cumulative earnings for each user.
#### Columns:
- userId: ID of the user (integer).
- totalDirectEarnings: Total earnings from direct referrals (float).
- totalIndirectEarnings: Total earnings from indirect referrals (float).


## 6. Real-Time Notifications
- WebSocket Event: earnings_update
- Triggered When: Earnings are updated due to a transaction.
- Emitted Data:
    ```json
    {
        "userId": 1,
        "totalDirectEarnings": 150,
        "totalIndirectEarnings": 15
    }
- Usage:
Frontend listens for this event to update the UI in real-time.

## 7. Key Considerations
- Validation:
Ensure transactions are only recorded for amounts > 1000.
Validate parent-child relationships during registration.
- Data Privacy:
Ensure sensitive user data is protected and not exposed in APIs.
- Edge Cases:
Handle scenarios where users or transactions exceed expected limits.

## 8. Deployment
- Backend:
Host using Node.js on a cloud platform like AWS, Heroku, or DigitalOcean.
- Frontend:
Deploy the React app using services like Vercel or Netlify.
- Database:
Use SQLite for development; migrate to MySQL/PostgreSQL for production.

## 9. Future Enhancements
- Multi-Page Frontend:
Add navigation for user management and reports.
- Analytics:
Generate advanced referral trees and earnings visualizations using charting libraries.
- Email Notifications:
Notify users of new earnings via email using FCM (firebase cloud messaging).
- Authentication:
Using JWT we can implement authentication.
