Request Flow:

Controller
-> FormRequest
-> DTO
-> Service
-> Repository
-> Resource
-> Response

Notes:
- Validation happens in FormRequest.
- Mapping request payload to business input happens in DTO.
- Service orchestrates business rules and transaction boundaries.
- Repository performs persistence and query composition.
- Resource shapes the API response.
