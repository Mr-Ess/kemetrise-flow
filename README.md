# KemetRise Flow

تمام. هاعتبر ده الـ Deliverable النهائي: برومبت واحد متكامل، تقدر تسلمه مباشرة لأداة التطوير عشان تبني النظام فعليًا، مش مجرد Mockup.

KemetRise Customer & Sales Operations System

FINAL BUILD DELIVERABLE — MVP v1.0

1. PROJECT MISSION

Build a fully functional internal business management system for KemetRise.

The system must manage the complete commercial lifecycle:

Lead → Customer → Sales Request → Costing → Quotation → Negotiation → Approval → Order → Payment → Delivery → Completion

The system is NOT intended to be a massive ERP or Enterprise CRM in this version.

The objective is to create a:

Fast

Simple

Professional

Reliable

Arabic-first

Dark Mode

Mobile-responsive

Database-backed

Permission-controlled

Workflow-driven

system that KemetRise can actually use for daily operations.

2. BRAND & DESIGN

Brand

KemetRise

Product/System name:

KemetRise Customer & Sales Operations System

Use the approved KemetRise logo and brand identity.

Do NOT use generic CRM branding.

UI

Default:

Dark Mode

Language:

Arabic RTL

Architecture must be ready for English / bilingual support later.

Visual language

Use:

Near-black main background

Dark gray cards

White/off-white primary text

Gray secondary text

KemetRise orange as the primary accent

Use semantic colors:

Green = Success

Amber = Warning / Pending

Red = Error / Overdue

Gray = Neutral

Orange = KemetRise Primary Action

The interface must feel like a modern professional internal operating system, not a generic admin template.

3. CORE BUSINESS MODEL

The system must distinguish between:

Customer

A person/company that may or does work with KemetRise.

Sales Request

A potential job/request from a customer that needs evaluation and pricing.

Costing

Internal calculation of how much the request will cost KemetRise.

Quotation

The approved commercial offer presented to the customer.

Order

A confirmed job after customer acceptance.

These are separate entities.

DO NOT automatically create an Order when Sales creates a Request.

4. MAIN WORKFLOW

Implement this exact workflow:

LEAD / CUSTOMER
      ↓
SALES REQUEST
      ↓
REQUEST REVIEW
      ↓
COSTING
      ↓
MANAGEMENT APPROVAL
      ↓
QUOTATION
      ↓
SALES
      ↓
CUSTOMER DECISION
      ↓
 ┌───────────────┐
 │               │
WON             LOST
 │               │
 ↓               ↓
ORDER        LOST REQUEST
 │
 ↓
EXECUTION
 │
 ↓
DELIVERY
 │
 ↓
COMPLETED

Every transition must be recorded in the Activity Log.

5. USER ROLES

Create role-based access control.

Initial roles:

Admin

Full access.

Management

Access to:

Customers

Requests

Costing

Quotations

Orders

Payments

Reports

Management Dashboard

Approvals

Sales

Access to:

Customers

Sales Requests

Quotations

Orders

Follow-ups

Customer information

Sales must NOT automatically see internal detailed costing or profit margin.

Sales sees:

Approved selling price

Approved quotation

Commercial terms

unless explicitly granted permission.

Costing

Access to:

Sales Requests

Costing

Products/Services

Cost components

Costing can calculate internal costs but cannot independently approve final commercial pricing unless permission is granted.

Staff

Limited access according to assigned permissions.

6. DASHBOARD

Create a main dashboard.

KPI Cards

Display:

Total Customers

New Customers

Open Sales Requests

Requests Waiting Costing

Requests Waiting Approval

Quotations Sent

Open Orders

Overdue Orders

Total Pipeline Value

Total Sales

Total Paid

Total Outstanding

7. SALES PIPELINE

Create a dedicated Sales Pipeline.

Stages:

New Lead

Customer

Request Created

Under Review

Costing

Pending Approval

Quotation Ready

Quotation Sent

Negotiation

Won

Lost

Converted to Order

Show:

Number of requests

Estimated value

Current stage

Age of request

8. CUSTOMERS

Create:

Customers

Each customer gets a unique Customer ID.

Example:

CUS-000001

Customer fields:

Customer ID

Full Name

Company Name

Phone

WhatsApp

Email

Address

Governorate

City

Lead Source

Referred By

Assigned Salesperson

Customer Status

Notes

Created At

Updated At

9. CUSTOMER STATUS

Use:

Prospect

Active

Inactive

Returning Customer

VIP

Lost

10. LEAD SOURCE

Provide:

Facebook

Instagram

TikTok

WhatsApp

Website

Google

Referral

Existing Customer

Walk-in

Other

Track referral source separately.

11. CUSTOMER 360

Customer profile must show everything related to the customer.

Tabs:

Overview

Customer information

Total requests

Total quotations

Total orders

Total sales

Total paid

Total outstanding

Requests

All Sales Requests.

Quotations

All quotations and revisions.

Orders

All confirmed orders.

Payments

All payments.

Documents

All customer documents.

Follow-ups

All sales activities.

Notes

Internal notes.

Activity

Complete timeline.

12. SALES REQUEST

Create a dedicated module:

Sales Requests

Button:

+ New Sales Request

This is the most important new module.

13. CREATE SALES REQUEST

Sales can create a request for:

Existing customer

New customer

If new customer:

Allow creation without leaving the request screen.

Request Fields

Request ID

Customer

Request Title

Service/Product

Description

Quantity

Unit

Specifications

Dimensions

Material

Color

Finish

Required Delivery Date

Priority

Salesperson

Customer Notes

Internal Notes

Attachments

Created Date

Request ID format:

REQ-000001

14. REQUEST TEMPLATES

Create configurable request templates.

Example:

If Product/Service A requires:

Quantity

Dimensions

Material

Color

Finish

the system automatically shows these fields.

Templates must be configurable by Admin.

The goal is to prevent Sales from forgetting critical information.

15. REQUEST ATTACHMENTS

Requests can contain:

Images

PDFs

Documents

Designs

Specifications

Other files

All files must remain attached to the Request.

16. REQUEST STATUS

Use:

Draft

Submitted

Under Review

Waiting Information

Costing in Progress

Costing Completed

Pending Approval

Quotation Ready

Quotation Sent

Negotiation

Customer Approved

Customer Rejected

Expired

Converted to Order

Cancelled

17. REQUEST SUBMISSION

When Sales clicks:

Submit for Costing

the system must:

Validate required information.

Save the Request.

Change status to:
Costing in Progress

Create Activity Log entry.

Notify Costing Department.

Add the request to Costing Queue.

18. COSTING QUEUE

Create:

Costing Dashboard

Show:

New requests

In-progress requests

Waiting information

Completed costing

Overdue costing

Each row:

Request ID

Customer

Request Type

Salesperson

Created Date

Required Date

Priority

Age

Status

19. COSTING WORKSPACE

Costing employee opens a Request.

Show all Sales Request information.

Then provide:

Cost Components

Raw Materials

Labor

Production

Transportation

External Services

Packaging

Other Costs

Each component:

Description

Quantity

Unit Cost

Total

Formula:

Component Total = Quantity × Unit Cost

20. COSTING CALCULATION

Automatically calculate:

Direct Cost

Sum of all cost components.

Additional Costs

Any extra operational costs.

Total Cost

Direct Cost + Additional Costs

Target Margin

Percentage.

Suggested Selling Price

Calculate automatically according to configured pricing rule.

Example:

Selling Price = Total Cost / (1 - Margin %)

Do NOT use simple cost + margin percentage if that would produce an incorrect gross-margin calculation.

21. PRICING RULES

Admin can configure:

Minimum Margin

Standard Margin

Maximum Discount

Approval Threshold

Example:

If:

Minimum Margin = 20%

and Sales attempts to sell below that margin:

require Management Approval.

22. COSTING VISIBILITY

Internal costing data is confidential.

By default:

Costing Department

Can see:

Full cost breakdown

Internal costs

Suggested price

Management

Can see everything.

Sales

Can see:

Approved selling price

Commercial terms

Sales should NOT see internal cost breakdown unless permission is explicitly enabled.

23. COSTING SUBMISSION

When Costing completes:

button:

Submit Costing

System changes:

Costing in Progress → Costing Completed

Then evaluate approval rules.

If approval is required:

Pending Approval

Otherwise:

Quotation Ready

Notify the appropriate users.

24. MANAGEMENT APPROVAL

Create an Approval screen.

Show:

Customer

Request

Cost

Proposed Selling Price

Margin

Discount

Delivery Time

Cost Breakdown

Notes

Actions:

Approve

Reject

Request Changes

Every approval action must be logged.

25. QUOTATIONS

Create:

Quotations

Quotation ID:

QUO-000001

A quotation is generated from a Sales Request.

Fields:

Quotation ID

Customer

Request

Version

Selling Price

Discount

Taxes if applicable

Delivery Time

Payment Terms

Valid Until

Notes

Status

26. QUOTATION VERSIONING

Never overwrite an old quotation.

If the quotation changes:

Create:

V1

V2

V3

Each version must remain accessible.

Track:

What changed

Who changed it

Date

Previous price

New price

Reason

Only one version can be marked as Current.

27. QUOTATION STATUS

Draft

Pending Approval

Approved

Sent

Viewed

Negotiation

Accepted

Rejected

Expired

Superseded

28. CUSTOMER DECISION

When Sales records:

Customer Accepted

the system should provide:

Convert to Order

When clicked:

Create Order.

Copy all relevant Request data.

Copy approved quotation data.

Preserve Customer.

Preserve attachments.

Link Order to Request.

Link Order to Quotation.

Record conversion Activity.

Notify relevant operational users.

No duplicate manual data entry.

29. LOST REQUEST

If customer rejects:

require a Lost Reason.

Options:

Price

Competitor

Delivery Time

Specification

Customer Budget

Customer Changed Mind

No Response

Other

Allow notes.

This data must be available in reports.

30. ORDERS

Order ID:

ORD-000001

Fields:

Order ID

Customer

Request

Quotation

Service/Product

Description

Quantity

Specifications

Assigned Department

Assigned User

Status

Total Price

Expected Delivery

Actual Delivery

Payment Status

Notes

31. ORDER STATUS

New

Confirmed

In Progress

Waiting Customer

Waiting Documents

Ready

Delivered

Completed

On Hold

Cancelled

Overdue

32. PAYMENTS

Create Payments module.

Payment ID:

PAY-000001

Fields:

Payment ID

Customer

Order

Amount

Payment Date

Payment Method

Transaction Reference

Received By

Notes

Payment methods:

Cash

Bank Transfer

InstaPay

Vodafone Cash

Card

Other

33. FINANCIAL CALCULATIONS

Do not allow manual manipulation of calculated values.

For every Order:

Paid Amount = SUM(all payments)

Remaining = Total Price - Paid Amount

Display:

Total

Paid

Remaining

Payment Percentage

Statuses:

Unpaid

Partially Paid

Fully Paid

Overdue

34. DOCUMENTS

Documents can belong to:

Customer

Sales Request

Quotation

Order

Document fields:

Document ID

Name

Type

Status

File

Uploaded By

Upload Date

Notes

Statuses:

Required

Requested

Received

Verified

Rejected

Missing

35. FOLLOW-UPS

Create a Follow-up / Tasks system.

Users can create:

Call Customer

WhatsApp Customer

Send Quotation

Follow Up

Request Information

Request Document

Internal Review

Other

Fields:

Task

Customer

Request

Assigned To

Due Date

Priority

Status

Notes

Statuses:

Pending

In Progress

Completed

Cancelled

Overdue

36. INTERNAL COMMENTS

Every Request, Quotation and Order must support internal comments.

Example:

Sales:

العميل محتاج التسليم خلال 5 أيام.

Costing:

التنفيذ الطبيعي 8 أيام.

Management:

اعتمدوا 5 أيام مع إضافة تكلفة الشحن السريع.

Comments must show:

User

Date

Time

37. ACTIVITY LOG

Create a complete audit trail.

Track:

Customer created

Request created

Request submitted

Status changed

Costing created

Cost changed

Quotation created

Quotation revised

Approval granted

Approval rejected

Payment added

Payment edited

Document uploaded

Order created

Order completed

Each event:

User

Action

Entity

Entity ID

Description

Timestamp

Activity logs should not be editable by normal users.

38. NOTIFICATIONS

Create an internal Notification Center.

Notify users when:

Sales

Costing completed

Approval completed

Customer follow-up due

Quotation expired

Costing

New request

Request information changed

Request returned for revision

Management

Approval required

Margin below threshold

High-value request

Overdue request

Operations

New Order

Order changed

Delivery approaching

Order overdue

Notifications should support:

In-app notification

Read/unread

Timestamp

Link to related record

Prepare architecture for future:

WhatsApp

Email

SMS

but do not implement external messaging in MVP unless explicitly required.

39. AGING & SLA

Every Request must show age.

Example:

Waiting Costing — 18h

Pending Approval — 2d

Configure optional SLA targets:

Costing SLA

Approval SLA

Sales Follow-up SLA

If SLA is exceeded:

mark as:

Overdue

and notify responsible users.

40. PRODUCT / SERVICE CATALOG

Create:

Products & Services

Fields:

Product/Service ID

Name

Category

Description

Unit

Default Cost

Reference Price

Default Margin

Typical Delivery Time

Active/Inactive

This is a reference catalog.

Actual quotation pricing must remain editable based on the individual Request.

41. REPORTS

Create Reports module.

Sales

Leads

Requests

Quotations

Won

Lost

Conversion Rate

Pipeline Value

Won Value

Average Order Value

Average Time to Close

Costing

Average Costing Time

Requests Pending Costing

Costing Completed

Revisions

Average Margin

Finance

Total Sales

Total Paid

Outstanding

Payments by period

Orders by payment status

Customers

New Customers

Active Customers

Returning Customers

Customers by Source

Top Customers

Lost Requests

Lost by reason

Lost value

Lost by salesperson

Lost by source

42. MANAGEMENT CONTROL TOWER

Create a Management-only dashboard.

Show:

Sales Pipeline

Total Pipeline

Requests

Quotations

Negotiations

Expected Wins

Revenue

Sales

Paid

Outstanding

Operations

Active Orders

Overdue Orders

Deliveries Today

Deliveries This Week

Performance

Salesperson performance

Costing performance

Conversion rate

Average quote time

Alerts

High-value requests

Low-margin quotations

Overdue requests

Overdue payments

Overdue orders

43. SEARCH

Global search must support:

Customer Name

Phone

Customer ID

Request ID

Quotation ID

Order ID

Payment ID

Product/Service

Search results must show entity type and status.

44. FILTERING

Every major list should support:

Date

Status

Customer

Salesperson

Department

Priority

Source

Assigned User

45. DASHBOARD QUICK ACTIONS

Provide:

New Customer

New Sales Request

New Payment

New Follow-up

New Document

46. DATABASE

Use a relational database.

Minimum entities:

users
roles
permissions

customers
customer_sources

products_services
request_templates

sales_requests
sales_request_items
sales_request_attachments

costings
costing_items

quotations
quotation_versions

orders
order_items

payments

documents

tasks
comments

notifications
activities

pricing_rules
approval_rules

Use proper foreign keys.

Use indexes on:

customer_id

phone

request_id

quotation_id

order_id

status

assigned_to

created_at

47. DATA INTEGRITY

Implement:

Foreign key constraints

Required field validation

Unique IDs

Transaction-safe payment updates

Permission checks

Server-side validation

Audit logging

Never rely only on frontend validation.

48. FINANCIAL SECURITY

Financial information must be permission controlled.

Do not expose:

Internal Cost

Margin

Cost Breakdown

to Sales unless permission exists.

Never allow a user to bypass this by modifying frontend requests.

Enforce authorization server-side.

49. RESPONSIVE DESIGN

The system must work properly on:

Desktop

Tablet

Mobile

Mobile users should be able to:

View customer

Add customer

Create request

Review request

Add notes

View quotation

Add payment

Complete follow-up

50. EMPTY / LOADING / ERROR STATES

Every screen must have:

Loading State

Skeleton/spinner.

Empty State

Clear explanation + action.

Error State

Human-readable error message + retry.

Never leave blank screens.

51. CONFIRMATION RULES

Require confirmation before:

Delete

Cancel

Reject

Convert to Order

Delete Payment

Approve sensitive quotation

Use clear confirmation dialogs.

52. DELETE POLICY

Do not hard-delete critical business records.

For:

Customers

Requests

Quotations

Orders

Payments

prefer:

Archive / Cancel / Soft Delete

Activity history must remain available.

53. MOCK DATA

Populate realistic test data.

At minimum:

20 Customers

40 Sales Requests

20 Quotations

Multiple quotation revisions

20 Orders

Payments

Documents

Follow-ups

Notifications

Activities

Include all statuses.

54. SAMPLE BUSINESS FLOW

The finished system must support this complete scenario:

Sales creates customer.

Sales opens new Request.

Sales enters specifications.

Sales uploads customer files.

Sales submits Request.

Costing receives notification.

Costing opens Request.

Costing enters material cost.

Costing enters labor.

Costing enters other costs.

System calculates total cost.

System calculates suggested selling price.

Request goes to Management if approval is required.

Management approves.

Quotation becomes ready.

Sales receives notification.

Sales sees approved selling price.

Sales sends quotation to customer.

Customer negotiates.

Sales creates quotation V2.

Management approves V2 if required.

Customer accepts.

Sales clicks Convert to Order.

Order is automatically created.

Payment is registered.

Order moves through execution.

Delivery is recorded.

Order becomes Completed.

Customer history contains the entire lifecycle.

This complete flow must work end-to-end.

55. FUTURE-READY ARCHITECTURE

Prepare clean extension points for future:

WhatsApp integration

Email

SMS

AI Sales Assistant

AI Costing Assistant

Automated Follow-ups

Customer Portal

Online Quotations

Digital Signature

Invoice generation

Accounting integration

n8n automation

API

Mobile App

KemetRise Credits

Advanced Analytics

DO NOT implement these in MVP unless required.

Do not over-engineer the MVP.

56. KEMETRISE ARCHITECTURE PRINCIPLE

Build the system so it can later become a module inside the broader:

KemetRise Enterprise / Operating System

But keep the MVP independently deployable.

Do not tightly couple the system to unrelated KemetRise modules.

57. SECURITY

Implement:

Authentication

Authorization

Role-based access control

Secure password handling

Session management

Server-side permission checks

Input validation

File upload validation

Audit trail

Never trust client-side permissions.

58. PERFORMANCE

The application should:

Load quickly

Use pagination

Avoid loading entire datasets unnecessarily

Use indexed queries

Use lazy loading where appropriate

Optimize dashboard queries

59. DEVELOPMENT REQUIREMENTS

This is a functional application, not a static prototype.

Do NOT deliver:

Static mockup only

Fake buttons

Fake database

Hardcoded dashboard values

Non-functional forms

Every core feature must work against the database.

60. ACCEPTANCE CRITERIA

The MVP is considered complete only when:

Customers

Create

Read

Update

Archive

Search

Filter

Sales Requests

Create

Edit

Submit

Assign

Track

Attach files

Comment

Change status

Costing

Receive request

Enter cost components

Calculate total cost

Calculate margin

Calculate suggested selling price

Submit

Revise

Approval

Review

Approve

Reject

Request changes

Quotations

Create

Version

Approve

Track

Mark accepted/rejected

Orders

Convert from accepted Request

Track

Update status

Delivery

Payments

Add

Calculate paid

Calculate remaining

Track payment status

Documents

Upload

Track

Verify

Reject

Follow-ups

Create

Assign

Track

Complete

Overdue

Notifications

Generate

Display

Mark read

Reports

Sales

Costing

Finance

Customers

Lost Requests

Permissions

Enforced server-side.

61. FINAL PRODUCT STRUCTURE

Main navigation:

KemetRise
│
├── Dashboard
│
├── Sales
│   ├── Pipeline
│   ├── Sales Requests
│   ├── Quotations
│   └── Follow-ups
│
├── Customers
│
├── Costing
│
├── Orders
│
├── Payments
│
├── Documents
│
├── Products & Services
│
├── Reports
│
├── Management Control Tower
│
└── Settings
    ├── Users
    ├── Roles & Permissions
    ├── Request Templates
    ├── Pricing Rules
    ├── Approval Rules
    └── System Settings

62. FINAL UX PRINCIPLE

The system must answer these questions immediately:

For Sales:

Who is the customer?

What does the customer want?

What is the current status?

Has it been priced?

What price can I offer?

When should I follow up?

For Costing:

What does the customer need?

What will it cost us?

What should we sell it for?

Does it need approval?

For Management:

What is coming in?

What are we likely to win?

What are we losing?

Why are we losing it?

What is our margin?

What is overdue?

For Operations:

What orders need execution?

What is due?

What is delayed?

For Finance:

What was sold?

What was paid?

What remains?

63. FINAL BUILD COMMAND

Build this as a production-ready MVP, not merely a visual prototype.

Prioritize:

Correct business workflow > Data integrity > Security > Usability > Visual polish

Use realistic Arabic/Egyptian business data in the initial seed/demo environment.

The application must be immediately usable by a small KemetRise team.

Keep the architecture clean and modular so future KemetRise modules can integrate through APIs and automation.

Do not add unnecessary enterprise complexity.

Do not remove any of the requirements above.

Where a technical implementation decision is not explicitly specified, choose the simplest secure and scalable implementation appropriate for an MVP.

The final result must be:

KemetRise Customer & Sales Operations System

A complete workflow-driven internal system covering:

Customer → Request → Costing → Approval → Quotation → Negotiation → Order → Payment → Delivery → Completion → Customer History.

ده هو الـ Deliverable النهائي اللي أنصح تسلمه لأداة التطوير مباشرة. أهم نقطة فيه إننا نقلنا النظام من مجرد تسجيل عملاء وأوردرات إلى دورة تشغيل كاملة من أول طلب التسعير لحد إغلاق الأوردر والتحصيل، مع فصل التكلفة الداخلية عن سعر البيع والصلاحيات.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9bf2f42a-de7b-492f-b65d-7fa634d94cd2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
