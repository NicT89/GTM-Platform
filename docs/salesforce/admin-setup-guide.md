# Salesforce Admin Setup Guide

This guide is intended for a customer-managed Salesforce admin because the application does not own the customer Salesforce stack.

## Goal

Provide the market intelligence application with near-real-time access to account, contact, lead, opportunity, and revenue data while maintaining customer-controlled security boundaries.

## Recommended Setup Path

1. Create a dedicated integration user.
2. Create a Connected App for OAuth.
3. Grant the minimum object, field, and event permissions needed.
4. Enable CDC or outbound event delivery where allowed.
5. Validate webhook or polling connectivity from the application.

## Required Objects

- `Account`
- `Contact`
- `Lead`
- `Opportunity`
- `OpportunityContactRole`
- `Campaign`
- `CampaignMember`
- `Task` and `Event` if engagement enrichment is desired

## Required Field Access

- Record identifiers: `Id`, `OwnerId`, `CreatedDate`, `LastModifiedDate`
- Lead and contact identity fields: `Email`, `Phone`, `LeadSource`, `Status`, `Lifecycle custom fields if used`
- Account fields: `Name`, `Website`, `Industry`, `BillingCountry`, `BillingState`, `BillingCity`
- Opportunity fields: `StageName`, `Amount`, `CloseDate`, `IsClosed`, `IsWon`, `CreatedDate`
- Campaign and membership fields used for attribution mapping
- Any custom revenue or location hierarchy fields that matter for reporting

## OAuth and Connected App

Configure a Connected App with:

- OAuth enabled
- Refresh token support
- API access
- Web / server flow redirect URI supplied by the application

Recommended scopes:

- `Access and manage your data (api)`
- `Perform requests at any time (refresh_token, offline_access)`
- `Manage user data via APIs` only if required by tenant policy

## Event Delivery

Preferred order:

1. Salesforce Change Data Capture for `Lead`, `Contact`, `Account`, `Opportunity`, `Campaign`, and `CampaignMember`
2. Platform Events or outbound messaging where CDC is unavailable
3. Five-minute incremental polling fallback by `SystemModstamp` or equivalent

## Validation Checklist

- OAuth connection succeeds with the dedicated integration user.
- The API user can read all required objects and fields.
- CDC or event subscriptions are active for the agreed objects.
- Sample updates in Salesforce appear in the application within the tenant SLA target.
- Opportunity close, amount, owner, and campaign membership changes are reflected correctly in attribution views.

## Security Notes

- Use a dedicated permission set rather than broad admin access where possible.
- Restrict the integration user to the business units or records required by the engagement.
- Rotate client secrets and review refresh token policy as part of onboarding.
