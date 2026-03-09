# API Documentation

## Overview

ResumeBoost API provides endpoints for resume analysis, user management, and consultation booking.

## Base URL

```
Development: http://localhost:3000/api
Production: https://resumeboost.vercel.app/api
```

## Authentication

Most endpoints require authentication using JWT tokens or session cookies.

```http
Authorization: Bearer <token>
# or
Cookie: next-auth.session-token=<token>
```

## Endpoints

### Resume Analysis

#### POST /api/resume/analyze
Analyze uploaded resume against job description.

**Request:**
```json
{
  "resume": "base64_encoded_resume",
  "jobDescription": "base64_encoded_job_description",
  "options": {
    "includeRecommendations": true,
    "analysisDepth": "detailed"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "matchScore": 85,
    "categories": {
      "skills": {
        "score": 90,
        "matches": ["React", "TypeScript", "Node.js"],
        "missing": ["Python", "Docker"]
      },
      "experience": {
        "score": 80,
        "relevantYears": 5,
        "requiredYears": 7
      },
      "education": {
        "score": 95,
        "degreeMatch": true
      }
    },
    "recommendations": [
      {
        "category": "skills",
        "priority": "high",
        "description": "Add Python experience to match job requirements",
        "actionable": true
      }
    ]
  }
}
```

#### GET /api/resume/analysis/:id
Retrieve previous analysis results.

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "resume": {
      "filename": "resume.pdf",
      "size": 245760
    },
    "jobDescription": {
      "title": "Senior Frontend Developer",
      "company": "Tech Corp"
    },
    "results": { /* analysis results */ }
  }
}
```

### File Upload

#### POST /api/upload/resume
Upload resume file for analysis.

**Request:** `multipart/form-data`
```
file: [resume file]
userId: [user identifier]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "filename": "resume.pdf",
    "size": 245760,
    "type": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/upload/job-description
Upload job description file.

**Request:** `multipart/form-data`
```
file: [job description file]
analysisId: [resume analysis ID]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "filename": "job-description.txt",
    "size": 1024,
    "type": "text/plain"
  }
}
```

### Consultation Booking

#### POST /api/consultation/book
Book consultation session with expert.

**Request:**
```json
{
  "analysisId": "uuid",
  "consultationType": "resume-review",
  "preferredTime": "2024-01-20T14:00:00Z",
  "duration": 60,
  "notes": "Focus on technical skills section"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "uuid",
    "confirmed": true,
    "expert": {
      "name": "John Doe",
      "specialization": "Frontend Development",
      "rating": 4.8
    },
    "timeSlot": {
      "start": "2024-01-20T14:00:00Z",
      "end": "2024-01-20T15:00:00Z"
    }
  }
}
```

#### GET /api/consultation/availability
Get available consultation time slots.

**Query Parameters:**
- `type`: consultation type (resume-review, interview-prep, career-coaching)
- `date`: date in YYYY-MM-DD format (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-20",
    "slots": [
      {
        "start": "2024-01-20T09:00:00Z",
        "end": "2024-01-20T10:00:00Z",
        "available": true
      },
      {
        "start": "2024-01-20T14:00:00Z",
        "end": "2024-01-20T15:00:00Z",
        "available": true
      }
    ]
  }
}
```

### Portfolio

#### GET /api/portfolio/examples
Get portfolio examples and success stories.

**Query Parameters:**
- `industry`: filter by industry (optional)
- `limit`: number of results (default: 10)
- `offset`: pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "examples": [
      {
        "id": "uuid",
        "title": "Frontend Developer Resume",
        "industry": "Technology",
        "beforeImage": "https://cdn.example.com/before.jpg",
        "afterImage": "https://cdn.example.com/after.jpg",
        "improvements": [
          "Added technical skills section",
          "Improved formatting",
          "Quantified achievements"
        ],
        "results": {
          "interviewsIncrease": "300%",
          "offerReceived": true,
          "salaryIncrease": "25%"
        }
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### GET /api/portfolio/examples/:id
Get detailed portfolio example.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Frontend Developer Resume",
    "client": "Jane Smith",
    "industry": "Technology",
    "challenge": "Outdated resume format",
    "solution": "Modern resume with quantified achievements",
    "beforeResume": "base64_encoded_content",
    "afterResume": "base64_encoded_content",
    "improvements": [
      {
        "area": "Skills",
        "change": "Added technical skills section",
        "impact": "Better ATS compatibility"
      }
    ],
    "timeline": {
      "startDate": "2024-01-01",
      "completionDate": "2024-01-15",
      "interviewDate": "2024-01-20",
      "offerDate": "2024-01-25"
    }
  }
}
```

### User Management

#### GET /api/user/profile
Get user profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription": {
      "plan": "premium",
      "expiresAt": "2024-12-31T23:59:59Z",
      "features": ["unlimited-analysis", "priority-support"]
    },
    "statistics": {
      "analysesCompleted": 15,
      "consultationsBooked": 3,
      "successRate": 0.87
    }
  }
}
```

#### PUT /api/user/profile
Update user profile information.

**Request:**
```json
{
  "name": "John Doe",
  "industry": "Technology",
  "experience": "senior",
  "preferences": {
    "notifications": true,
    "emailUpdates": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "updatedFields": ["name", "industry", "experience"],
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid file format",
    "details": {
      "field": "file",
      "allowedTypes": ["pdf", "doc", "docx"],
      "maxSize": "5MB"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request data
- `AUTHENTICATION_REQUIRED` - Missing or invalid authentication
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Free tier**: 100 requests/hour
- **Premium tier**: 1000 requests/hour
- **Enterprise**: Unlimited

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642291200
```

## Webhooks

### Analysis Complete
Triggered when resume analysis is complete.

**Payload:**
```json
{
  "event": "analysis.complete",
  "data": {
    "analysisId": "uuid",
    "userId": "uuid",
    "completedAt": "2024-01-15T10:30:00Z",
    "results": { /* analysis results */ }
  }
}
```

### Consultation Reminder
Triggered 24 hours before scheduled consultation.

**Payload:**
```json
{
  "event": "consultation.reminder",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "scheduledAt": "2024-01-20T14:00:00Z",
    "expert": {
      "name": "John Doe",
      "specialization": "Frontend Development"
    }
  }
}
```

## SDK and Libraries

### JavaScript/TypeScript
```bash
npm install @resumeboost/client
```

```typescript
import { ResumeBoostClient } from '@resumeboost/client';

const client = new ResumeBoostClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.resumeboost.com'
});

const analysis = await client.resume.analyze({
  resume: resumeFile,
  jobDescription: jobDescription
});
```

### Python
```bash
pip install resumeboost-python
```

```python
from resumeboost import ResumeBoostClient

client = ResumeBoostClient(api_key='your-api-key')
analysis = client.resume.analyze(
    resume=resume_file,
    job_description=job_description
)
```

## Testing

### Test Environment
- **URL**: https://api-test.resumeboost.com
- **Authentication**: Use test API keys
- **Data**: Mock data for testing

### Mock Responses
Use the `X-Mock-Response` header to simulate different responses:

```http
X-Mock-Response: error
X-Mock-Response: timeout
X-Mock-Response: slow-response
```

## Support

- **Documentation**: https://docs.resumeboost.com
- **API Status**: https://status.resumeboost.com
- **Support**: api-support@resumeboost.com
- **Community**: https://community.resumeboost.com
