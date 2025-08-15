# QuestionBank API Documentation

## Overview

API cho quản lý ngân hàng câu hỏi (QuestionBank) với đầy đủ các chức năng CRUD.

Base URL: `/api/question-bank`

## Authentication

- Các endpoint tạo, cập nhật, xóa câu hỏi yêu cầu quyền Admin
- Header: `Authorization: Bearer <token>`

## Data Schema

```javascript
{
  _id: ObjectId,
  contentQuestion: String, // Nội dung câu hỏi (required)
  contentQuestionNormalized: String, // Nội dung đã chuẩn hóa để kiểm tra trùng lặp (auto-generated)
  contentAnswer: Object, // Nội dung câu trả lời (optional)
  correctAnswer: Object, // Đáp án đúng (required)
  subject: String, // "MATH" | "ENGLISH" (required)
  type: String, // "TN" | "TLN" (required)
  explanation: String, // Giải thích (optional)
  difficulty: String, // "EASY" | "MEDIUM" | "HARD" (required)
  questionType: {
    text: String, // Tên loại câu hỏi
    code: String  // Mã loại câu hỏi (required)
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Endpoints

### 1. Tạo câu hỏi mới

**POST** `/api/question-bank/create`

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**

```json
{
  "contentQuestion": "Tìm giá trị của x trong phương trình 2x + 5 = 15",
  "correctAnswer": {
    "answer": "x = 5",
    "options": ["x = 3", "x = 5", "x = 7", "x = 10"]
  },
  "subject": "MATH",
  "type": "TN",
  "explanation": "2x + 5 = 15 => 2x = 10 => x = 5",
  "difficulty": "EASY",
  "questionType": "Algebra;Linear equations in one variable"
}
```

**Response:**

```json
{
  "message": "Tạo câu hỏi thành công",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "contentQuestion": "Tìm giá trị của x trong phương trình 2x + 5 = 15",
    "correctAnswer": {
      "answer": "x = 5",
      "options": ["x = 3", "x = 5", "x = 7", "x = 10"]
    },
    "subject": "MATH",
    "type": "TN",
    "explanation": "2x + 5 = 15 => 2x = 10 => x = 5",
    "difficulty": "EASY",
    "questionType": "Algebra;Linear equations in one variable",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

### 2. Tạo nhiều câu hỏi cùng lúc

**POST** `/api/question-bank/create-multiple`

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**

```json
{
  "questions": [
    {
      "contentQuestion": "Câu hỏi 1",
      "correctAnswer": { "answer": "A" },
      "subject": "MATH",
      "type": "TN",
      "explanation": "Giải thích 1",
      "difficulty": "EASY",
      "questionType": "Algebra;Linear equations in one variable"
    },
    {
      "contentQuestion": "Câu hỏi 2",
      "correctAnswer": { "answer": "B" },
      "subject": "ENGLISH",
      "type": "TLN",
      "explanation": "Giải thích 2",
      "difficulty": "MEDIUM",
      "questionType": "Standard English Conventions;Form, Structure, and Sense"
    }
  ]
}
```

### 3. Lấy danh sách câu hỏi

**GET** `/api/question-bank?page=1&limit=10&subject=MATH&difficulty=EASY`

**Query Parameters:**

- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số câu hỏi mỗi trang (default: 10)
- `subject` (optional): "MATH" | "ENGLISH"
- `type` (optional): "TN" | "TLN"
- `difficulty` (optional): "EASY" | "MEDIUM" | "HARD"
- `questionType` (optional): Loại câu hỏi (search by code)
- `search` (optional): Tìm kiếm theo nội dung

**Response:**

```json
{
  "message": "Lấy danh sách câu hỏi thành công",
  "data": {
    "questions": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### 4. Tìm kiếm câu hỏi nâng cao

**POST** `/api/question-bank/search`

**Body:**

```json
{
  "page": 1,
  "limit": 10,
  "search": "phương trình",
  "subjects": ["MATH"],
  "types": ["TN", "TLN"],
  "difficulties": ["EASY", "MEDIUM"],
  "questionTypes": [
    "algebra_linear_equations_in_one_variable",
    "craft_and_structure_words_in_context"
  ],
  "sortBy": "createdAt",
  "sortOrder": "desc"
}
```

### 5. Lấy thống kê câu hỏi

**GET** `/api/question-bank/stats`

**Response:**

```json
{
  "message": "Lấy thống kê câu hỏi thành công",
  "data": {
    "total": 100,
    "bySubject": [
      { "_id": "MATH", "count": 60 },
      { "_id": "ENGLISH", "count": 40 }
    ],
    "byDifficulty": [
      { "_id": "EASY", "count": 30 },
      { "_id": "MEDIUM", "count": 45 },
      { "_id": "HARD", "count": 25 }
    ],
    "byType": [
      { "_id": "TN", "count": 70 },
      { "_id": "TLN", "count": 30 }
    ],
    "byQuestionType": [
      { "_id": "algebra_linear_equations_in_one_variable", "count": 25 },
      { "_id": "craft_and_structure_words_in_context", "count": 20 },
      { "_id": "standard_english_conventions_boundaries", "count": 15 }
    ]
  }
}
```

### 6. Lấy câu hỏi theo ID

**GET** `/api/question-bank/:id`

**Response:**

```json
{
  "message": "Lấy thông tin câu hỏi thành công",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "contentQuestion": "...",
    "correctAnswer": {...},
    "subject": "MATH",
    "type": "TN",
    "explanation": "...",
    "difficulty": "EASY",
    "questionType": "...",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

### 7. Cập nhật câu hỏi

**PUT** `/api/question-bank/:id`

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:** (Có thể cập nhật một phần)

```json
{
  "difficulty": "MEDIUM",
  "explanation": "Giải thích mới..."
}
```

### 8. Xóa câu hỏi

**DELETE** `/api/question-bank/:id`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "message": "Xóa câu hỏi thành công",
  "data": {...}
}
```

### 9. Xóa nhiều câu hỏi

**DELETE** `/api/question-bank`

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**

```json
{
  "ids": ["64f1a2b3c4d5e6f7g8h9i0j1", "64f1a2b3c4d5e6f7g8h9i0j2"]
}
```

**Response:**

```json
{
  "message": "Đã xóa 2 câu hỏi thành công",
  "data": {
    "deletedCount": 2,
    "requestedCount": 2
  }
}
```

## Error Codes

- `200`: Thành công
- `400`: Lỗi dữ liệu đầu vào
- `401`: Không có quyền truy cập
- `404`: Không tìm thấy
- `500`: Lỗi server

## Validation Rules

1. `contentQuestion`: Bắt buộc, không được rỗng
2. `correctAnswer`: Bắt buộc, phải là object
3. `subject`: Bắt buộc, phải là "MATH" hoặc "ENGLISH"
4. `type`: Bắt buộc, phải là "TN" hoặc "TLN"
5. `explanation`: Tùy chọn
6. `difficulty`: Bắt buộc, phải là "EASY", "MEDIUM" hoặc "HARD"
7. `questionType`: Bắt buộc, phải là một trong các giá trị hợp lệ (xem danh sách bên dưới)

## Exam Generation

### 1. Tạo đề thi với nhiều bộ filter

**POST** `/api/question-bank/generate-filtered-exam`

Tạo đề thi từ nhiều bộ filter khác nhau (questionType + difficulty + numberOfQuestions).

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "subject": "MATH",
  "filters": [
    {
      "questionType": "algebra_linear_equations_in_one_variable",
      "numberOfQuestions": 10,
      "difficulty": "EASY"
    },
    {
      "questionType": "geometry_coordinate_geometry",
      "numberOfQuestions": 15,
      "difficulty": "MEDIUM"
    },
    {
      "questionType": "advanced_math_nonlinear_functions",
      "numberOfQuestions": 5,
      "difficulty": "HARD"
    }
  ]
}
```

**Parameters:**

- `subject` (required): "MATH" | "ENGLISH" - Môn học
- `filters` (required): Array of filter objects
  - `questionType` (required): Mã dạng bài
  - `numberOfQuestions` (required): Số câu hỏi (1-50)
  - `difficulty` (required): "EASY" | "MEDIUM" | "HARD"

**Validation Rules:**

- Tổng số câu hỏi từ tất cả filters không được vượt quá 50
- Mỗi filter phải có đủ câu hỏi trong database
- questionType phải hợp lệ và tồn tại

**Response:**

```json
{
  "message": "Tạo đề thi thành công với 3 bộ filter",
  "data": {
    "title": "Đề Luyện Tập 10SAT - Multi Filter",
    "totalQuestions": 30,
    "totalFilters": 3,
    "questions": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "contentQuestion": "Giải phương trình: 3x - 7 = 20",
        "contentAnswer": {
          "A": "x = 9",
          "B": "x = 27/3",
          "C": "x = 13/3",
          "D": "x = 7"
        },
        "correctAnswer": "A",
        "subject": "MATH",
        "type": "TN",
        "explanation": "3x - 7 = 20 => 3x = 27 => x = 9",
        "difficulty": "EASY",
        "questionType": {
          "text": "Algebra;Linear equations in one variable",
          "code": "algebra_linear_equations_in_one_variable"
        },
        "filterIndex": 1,
        "filterInfo": {
          "questionType": "algebra_linear_equations_in_one_variable",
          "difficulty": "EASY",
          "requestedCount": 10
        }
      }
    ],
    "subject": "MATH",
    "filterSummary": [
      {
        "filterIndex": 1,
        "questionType": "algebra_linear_equations_in_one_variable",
        "difficulty": "EASY",
        "requested": 10,
        "available": 25,
        "obtained": 10
      },
      {
        "filterIndex": 2,
        "questionType": "geometry_coordinate_geometry",
        "difficulty": "MEDIUM",
        "requested": 15,
        "available": 20,
        "obtained": 15
      },
      {
        "filterIndex": 3,
        "questionType": "advanced_math_nonlinear_functions",
        "difficulty": "HARD",
        "requested": 5,
        "available": 8,
        "obtained": 5
      }
    ],
    "appliedFilters": [
      {
        "questionType": "algebra_linear_equations_in_one_variable",
        "numberOfQuestions": 10,
        "difficulty": "EASY"
      },
      {
        "questionType": "geometry_coordinate_geometry",
        "numberOfQuestions": 15,
        "difficulty": "MEDIUM"
      },
      {
        "questionType": "advanced_math_nonlinear_functions",
        "numberOfQuestions": 5,
        "difficulty": "HARD"
      }
    ]
  }
}
```

**Error Responses:**

1. **Tổng số câu hỏi vượt quá 50:**

```json
{
  "message": "Tổng số câu hỏi yêu cầu (55) không được vượt quá 50 câu",
  "totalRequested": 55,
  "maxAllowed": 50
}
```

2. **Không đủ câu hỏi cho filter:**

```json
{
  "message": "Filter 2 (geometry_coordinate_geometry, HARD): Không đủ câu hỏi. Chỉ có 3 câu, cần 10 câu",
  "filterIndex": 2,
  "filter": {
    "questionType": "geometry_coordinate_geometry",
    "numberOfQuestions": 10,
    "difficulty": "HARD"
  },
  "available": 3,
  "required": 10
}
```

3. **Filter validation error:**

```json
{
  "message": "Filter 1: questionType không hợp lệ"
}
```

### 2. Tạo đề thi random

**POST** `/api/question-bank/generate-random-exam`

Tạo đề thi random từ tất cả câu hỏi của một môn học.

**Body:**

```json
{
  "subject": "MATH",
  "numberOfQuestions": 25
}
```

**Response:**

```json
{
  "message": "Tạo đề thi random thành công",
  "data": {
    "title": "Đề Luyện Tập 10SAT",
    "numberOfQuestions": 25,
    "questions": [...],
    "subject": "MATH"
  }
}
```

## Duplicate Detection

Hệ thống sẽ tự động kiểm tra và ngăn chặn việc tạo câu hỏi trùng lặp dựa trên:

- **Chuẩn hóa nội dung**: Loại bỏ dấu cách thừa và chuyển về chữ thường
- **Kiểm tra trong batch**: Khi tạo nhiều câu hỏi, hệ thống kiểm tra trùng lặp trong chính request
- **Kiểm tra với database**: Sử dụng MongoDB index để kiểm tra nhanh với dữ liệu hiện có
- **Unique constraint**: Database đảm bảo không có 2 câu hỏi giống nhau

**Ví dụ chuẩn hóa:**

- Input: `"Tuan       tu            dsdl"`
- Normalized: `"tuan tu dsdl"`

## Question Type Codes

Khi tạo câu hỏi, bạn có thể sử dụng text gốc (ví dụ: "Algebra;Linear equations in one variable"), hệ thống sẽ tự động chuyển đổi thành code tương ứng.

Khi tìm kiếm hoặc filter, sử dụng **code** để có kết quả chính xác hơn.

### English (ENGLISH)

- `craft_and_structure_cross_text_connections`
- `craft_and_structure_text_structure_and_purpose`
- `craft_and_structure_words_in_context`
- `expression_of_ideas_rhetorical_synthesis`
- `expression_of_ideas_transitions`
- `information_and_ideas_central_ideas_and_details`
- `information_and_ideas_command_of_evidence`
- `information_and_ideas_inferences`
- `standard_english_conventions_boundaries`
- `standard_english_conventions_form_structure_and_sense`

### Math (MATH)

- `algebra_linear_equations_in_one_variable`
- `algebra_linear_functions`
- `algebra_linear_equations_in_two_variables`
- `algebra_systems_of_two_linear_equations_in_two_variables`
- `algebra_linear_inequalities_in_one_or_two_variables`
- `advanced_math_equivalent_expressions`
- `advanced_math_nonlinear_equations_in_one_variable_and_systems_of_equations_in_two_variables`
- `advanced_math_nonlinear_functions`
- `problem_solving_and_data_analysis_ratios_rates_proportional_relationships_and_units`
- `problem_solving_and_data_analysis_percentages`
- `problem_solving_and_data_analysis_one_variable_data_distributions_and_measures_of_center_and_spread`
- `problem_solving_and_data_analysis_two_variable_data_models_and_scatterplots`

## Examples

### Ví dụ tạo câu hỏi Toán

```javascript
const createMathQuestion = async () => {
  const response = await fetch("/api/question-bank/create", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentQuestion: "Giải phương trình: x² - 5x + 6 = 0",
      correctAnswer: {
        answer: "x = 2 hoặc x = 3",
        options: ["x = 1, 2", "x = 2, 3", "x = 3, 4", "x = 1, 3"],
      },
      subject: "MATH",
      type: "TN",
      explanation: "x² - 5x + 6 = 0 ⟺ (x-2)(x-3) = 0 ⟺ x = 2 hoặc x = 3",
      difficulty: "MEDIUM",
      questionType:
        "Advanced Math;Nonlinear equations in one variable and systems of equations in two variables",
    }),
  });

  const data = await response.json();
  console.log(data);
};
```

### Ví dụ tạo câu hỏi Tiếng Anh

```javascript
const createEnglishQuestion = async () => {
  const response = await fetch("/api/question-bank/create", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentQuestion:
        "Choose the correct form: I _____ to the market yesterday.",
      correctAnswer: {
        answer: "went",
        options: ["go", "went", "going", "gone"],
      },
      subject: "ENGLISH",
      type: "TN",
      explanation: "Past tense của 'go' là 'went'",
      difficulty: "EASY",
      questionType: "Standard English Conventions;Form, Structure, and Sense",
    }),
  });

  const data = await response.json();
  console.log(data);
};

// Ví dụ tìm kiếm theo questionType.code
const searchByQuestionTypeCode = async () => {
  const response = await fetch("/api/question-bank/search", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      page: 1,
      limit: 10,
      questionTypes: ["algebra_linear_equations_in_one_variable"],
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
  });

  const data = await response.json();
  console.log(data);
};
```
