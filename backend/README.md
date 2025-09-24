## API Reference

### Tier List

- `WS /tierlist/:name`: WebSocket that streams broadcaster tier list info.
  - The first message sent is metadata on the broadcaster.
    | Field | Type | Description |
    | - | - | - |
    | id | string | Broadcaster's ID. |
    | broadcaster_login | string | Broadcaster's login name. |
    | display_name | string | Broadcaster's display name. |
    | is_live | boolean | Indicates whether they're currently streaming. |
    | thumbnail_url | string | A URL to the broadcaster's profile image. |
  - Subsequent periodic messages are either of the following:
    - Tier List
      | Field | Type | Description |
      | - | - | - |
      | type | string | Literal `tierlist`. |
      | success | boolean | True if `tierlist` field is not undefined, otherwise false. |
      | tier_list | TierList | The latest tier list. |
    - Listen Status
      | Field | Type | Description |
      | - | - | - |
      | type | string | Literal `listen`. |
      | status | string | `ok` if successfully listening to the broadcaster's chat. `full` if failing because of Twitch chat room join limit. `error` if failing for some other reason. |
  - Connection fails with 404 Not Found if no broadcaster with specified name was found.
- `PUT /tierlist`: Sets user's tier list.
  - Request Body:
    | Field | Type | Description |
    | - | - | - |
    | tier_list | FreshTierList | The new tier list. |
- `POST /tierlist/tier`: Adds a new tier to user's tier list.
  - Request Body:
    | Field | Type | Description |
    | - | - | - |
    | name | string | Tier name. |
    | color | string | Color code. |
  - Responds with 409 Conflict if a tier already exists with name.
- `PATCH /tierlist/tier/:name`: Updates an existing tier from user's tier list.
  - Request Body:
    | Field | Type | Description |
    | - | - | - |
    | name | string? | New tier name. |
    | color | string? | New color code. |
  - Responds with 404 Not Found if tier with name couldn't be found.
  - Responds with 400 Bad Request if both name and color fields are missing.
- `POST /tierlist/item`: Adds a new item to user's tier list.
  - Request Body:
    | Field | Type | Description |
    | - | - | - |
    | name | string | Item name. |
    | image_url | string? | Color code. |
  - Responds with 409 Conflict if an item already exists with name.
- `PATCH /tierlist/item/:name`: Updates an existing item from user's tier list.
  - Request Body:
    | Field | Type | Description |
    | - | - | - |
    | name | string? | New item name. |
    | image_url | string? | New color code. |
  - Responds with 404 Not Found if item with name couldn't be found.
  - Responds with 400 Bad Request if both name and color fields are missing.
- `DELETE /tierlist/item/:name`: Deletes an existing item from user's tier list.
  - Responds with 404 Not Found if item with name couldn't be found.
- `PATCH /tierlist`: Updates the focus or isVoting property of user's tierlist.
  - Request Body:
    | Field | Type | Description |
    | - | - | - |
    | focus | (string\|null)? | Name of item to focus. |
    | is_voting | boolean? | Set whether user tier list can be voted on. |
  - Responds with 400 Bad Request if both focus and is_voting fields are missing.

*Other than the WebSocket endpoint, all endpoints expect a session cookie to identify the user's tier list.*

TODO

- [x] Login/Logout
- [x] Create Twitch API Client
- [x] Auto refresh token
- [x] WebSocket connection Twitch
- [x] Chat Listener
- [x] Axios interceptor for Twitch
- [x] Listen route
- [ ] Update tier list routes
- [x] Change when tier list locking happens
- [x] Add tier list versioning for sync

