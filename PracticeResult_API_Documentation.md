# PracticeResult API Documentation

## Overview

API cho quản lý kết quả luyện tập của người dùng với các thống kê chi tiết.

Base URL: `/api/practice-result`

## Authentication

- Tất cả endpoints yêu cầu authentication
- Header: `Authorization: Bearer <token>`

## Data Schema

```javascript
{
  _id: ObjectId,
  questionId: String, // ID câu hỏi (ref: QuestionBanks)
  userId: String, // ID người dùng (ref: Users)
  isCorrect: Boolean, // Đúng hay sai
  createdAt: Date,
  updatedAt: Date
}
```

## Endpoints

### 1. Nộp bài luyện tập

**POST** `/api/practice-result/submit`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "userAnswers": {
    "64f1a2b3c4d5e6f7g8h9i0j1": "A",
    "64f1a2b3c4d5e6f7g8h9i0j2": "B",
    "64f1a2b3c4d5e6f7g8h9i0j3": "C"
  },
  "questions": [
    "64f1a2b3c4d5e6f7g8h9i0j1",
    "64f1a2b3c4d5e6f7g8h9i0j2",
    "64f1a2b3c4d5e6f7g8h9i0j3"
  ]
}
```

**Response:**

```json
{
  "message": "Nộp bài luyện tập thành công",
  "data": {
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "totalQuestions": 3,
    "correctAnswers": 2,
    "incorrectAnswers": 1,
    "accuracy": 67,
    "results": [
      {
        "questionId": "64f1a2b3c4d5e6f7g8h9i0j1",
        "isCorrect": true,
        "userAnswer": "A"
      },
      {
        "questionId": "64f1a2b3c4d5e6f7g8h9i0j2",
        "isCorrect": true,
        "userAnswer": "B"
      },
      {
        "questionId": "64f1a2b3c4d5e6f7g8h9i0j3",
        "isCorrect": false,
        "userAnswer": "C"
      }
    ]
  }
}
```

### 2. Luyện tập theo dạng bài

**POST** `/api/practice-result/practice-by-type`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "questionType": "algebra_linear_equations_in_one_variable",
  "numberOfQuestions": 5,
  "subject": "MATH"
}
```

**Parameters:**

- `questionType` (required): Mã dạng bài (e.g., "algebra_linear_equations_in_one_variable")
- `numberOfQuestions` (required): Số câu hỏi cần lấy (1-50)
- `subject` (optional): "MATH" | "ENGLISH" - Lọc theo môn học, nếu không có sẽ lấy tất cả môn

**Response:**

```json
{
  "message": "Lấy câu hỏi luyện tập theo dạng bài môn MATH thành công",
  "data": {
    "questionType": "algebra_linear_equations_in_one_variable",
    "questionTypeName": "Algebra;Linear equations in one variable",
    "subject": "MATH",
    "totalAvailable": 15,
    "requestedQuestions": 5,
    "actualQuestions": 5,
    "practiceQuestions": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "questionId": "64f1a2b3c4d5e6f7g8h9i0j2",
        "userId": "64f1a2b3c4d5e6f7g8h9i0j3",
        "isCorrect": false,
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T10:00:00.000Z",
        "question": {
          "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
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
          "difficulty": "EASY",
          "questionType": {
            "text": "Algebra;Linear equations in one variable",
            "code": "algebra_linear_equations_in_one_variable"
          },
          "explanation": "3x - 7 = 20 => 3x = 27 => x = 9"
        }
      }
    ],
    "suggestion": null,
    "stats": {
      "mathQuestions": 5,
      "englishQuestions": 0,
      "easyQuestions": 2,
      "mediumQuestions": 2,
      "hardQuestions": 1
    }
  }
}
```

**Response khi không có câu hỏi:**

```json
{
  "message": "Không tìm thấy câu hỏi sai nào cho dạng bài \"algebra_linear_equations_in_one_variable\" môn MATH",
  "data": {
    "questionType": "algebra_linear_equations_in_one_variable",
    "questionTypeName": "Algebra;Linear equations in one variable",
    "subject": "MATH",
    "totalAvailable": 0,
    "requestedQuestions": 5,
    "actualQuestions": 0,
    "practiceQuestions": []
  }
}
```

**Response khi không filter theo môn:**

```json
{
  "message": "Lấy câu hỏi luyện tập theo dạng bài thành công",
  "data": {
    "questionType": "algebra_linear_equations_in_one_variable",
    "questionTypeName": "Algebra;Linear equations in one variable",
    "subject": "ALL",
    "totalAvailable": 25,
    "requestedQuestions": 10,
    "actualQuestions": 10,
    "practiceQuestions": [...],
    "stats": {
      "mathQuestions": 6,
      "englishQuestions": 4,
      "easyQuestions": 3,
      "mediumQuestions": 4,
      "hardQuestions": 3
    }
  }
}
```

### 3. Luyện tập tất cả dạng bài

**POST** `/api/practice-result/practice-all`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "numberOfQuestions": 10,
  "subject": "MATH"
}
```

**Parameters:**

- `numberOfQuestions` (required): Số câu hỏi cần lấy (1-50)
- `subject` (optional): "MATH" | "ENGLISH" - Lọc theo môn học, nếu không có sẽ lấy tất cả môn

**Response:**

```json
{
  "message": "Lấy câu hỏi luyện tập tất cả dạng bài môn MATH thành công",
  "data": {
    "subject": "MATH",
    "totalAvailable": 45,
    "requestedQuestions": 10,
    "actualQuestions": 10,
    "practiceQuestions": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "questionId": "64f1a2b3c4d5e6f7g8h9i0j2",
        "userId": "64f1a2b3c4d5e6f7g8h9i0j3",
        "isCorrect": false,
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T10:00:00.000Z",
        "question": {
          "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
          "contentQuestion": "Tính đạo hàm của f(x) = x³ + 2x² - 5x + 1",
          "contentAnswer": {
            "A": "f'(x) = 3x² + 4x - 5",
            "B": "f'(x) = 3x² + 4x + 5",
            "C": "f'(x) = x² + 4x - 5",
            "D": "f'(x) = 3x + 4x - 5"
          },
          "correctAnswer": "A",
          "subject": "MATH",
          "type": "TN",
          "difficulty": "MEDIUM",
          "questionType": {
            "text": "Advanced Math;Equivalent expressions",
            "code": "advanced_math_equivalent_expressions"
          },
          "explanation": "Áp dụng quy tắc đạo hàm: (x^n)' = n*x^(n-1)"
        }
      }
    ],
    "distribution": [
      {
        "_id": "MATH",
        "difficulties": [
          { "difficulty": "EASY", "count": 15 },
          { "difficulty": "MEDIUM", "count": 20 },
          { "difficulty": "HARD", "count": 10 }
        ],
        "questionTypes": [
          {
            "questionType": "algebra_linear_equations_in_one_variable",
            "count": 8
          },
          {
            "questionType": "advanced_math_equivalent_expressions",
            "count": 12
          }
        ],
        "totalBySubject": 45
      }
    ],
    "suggestion": null,
    "stats": {
      "mathQuestions": 10,
      "englishQuestions": 0,
      "easyQuestions": 3,
      "mediumQuestions": 4,
      "hardQuestions": 3
    }
  }
}
```

**Response khi luyện tập tất cả môn:**

```json
{
  "message": "Lấy câu hỏi luyện tập tất cả dạng bài thành công",
  "data": {
    "subject": "ALL",
    "totalAvailable": 87,
    "requestedQuestions": 20,
    "actualQuestions": 20,
    "practiceQuestions": [...],
    "distribution": [
      {
        "_id": "ENGLISH",
        "difficulties": [...],
        "questionTypes": [...],
        "totalBySubject": 42
      },
      {
        "_id": "MATH",
        "difficulties": [...],
        "questionTypes": [...],
        "totalBySubject": 45
      }
    ],
    "stats": {
      "mathQuestions": 11,
      "englishQuestions": 9,
      "easyQuestions": 6,
      "mediumQuestions": 8,
      "hardQuestions": 6
    }
  }
}
```

### 4. Lấy danh sách câu hỏi đã trả lời sai

**GET** `/api/practice-result/incorrect-questions`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số bản ghi mỗi trang (default: 20)
- `subject` (optional): "MATH" | "ENGLISH" - Lọc theo môn học
- `questionType` (optional): Mã loại câu hỏi - Lọc theo loại câu hỏi
- `difficulty` (optional): "EASY" | "MEDIUM" | "HARD" - Lọc theo độ khó

**Response:**

```json
{
  "message": "Lấy danh sách câu hỏi sai thành công",
  "data": {
    "incorrectQuestions": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "questionId": "64f1a2b3c4d5e6f7g8h9i0j2",
        "userId": "64f1a2b3c4d5e6f7g8h9i0j3",
        "isCorrect": false,
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T10:00:00.000Z",
        "question": {
          "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
          "contentQuestion": "Giải phương trình: 2x + 5 = 15",
          "contentAnswer": {
            "A": "x = 5",
            "B": "x = 10",
            "C": "x = 15",
            "D": "x = 20"
          },
          "correctAnswer": "A",
          "subject": "MATH",
          "type": "TN",
          "difficulty": "EASY",
          "questionType": {
            "text": "Algebra;Linear equations in one variable",
            "code": "algebra_linear_equations_in_one_variable"
          },
          "explanation": "Để giải phương trình 2x + 5 = 15, ta trừ 5 cho cả hai vế và chia cho 2",
          "createdAt": "2024-01-20T09:00:00.000Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "itemsPerPage": 20
    },
    "summary": {
      "totalIncorrectQuestions": 95,
      "bySubject": [
        {
          "_id": "ENGLISH",
          "difficulties": [
            { "difficulty": "EASY", "count": 10 },
            { "difficulty": "MEDIUM", "count": 15 },
            { "difficulty": "HARD", "count": 8 }
          ],
          "totalBySubject": 33
        },
        {
          "_id": "MATH",
          "difficulties": [
            { "difficulty": "EASY", "count": 20 },
            { "difficulty": "MEDIUM", "count": 25 },
            { "difficulty": "HARD", "count": 17 }
          ],
          "totalBySubject": 62
        }
      ]
    },
    "filters": {
      "subject": "ALL",
      "questionType": "ALL",
      "difficulty": "ALL"
    }
  }
}
```

### 5. Lấy thống kê tổng quan

**GET** `/api/practice-result/stats`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Lấy thống kê thành công",
  "data": {
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "totalQuestions": 500,
    "questionsAnswered": 150,
    "correctAnswers": 120,
    "incorrectAnswers": 30,
    "remainingQuestions": 350,
    "progressPercentage": 30,
    "accuracyPercentage": 80
  }
}
```

### 6. Lấy thống kê theo môn học

**GET** `/api/practice-result/stats/:subject`

**Path Parameters:**

- `subject`: "MATH" | "ENGLISH"

**Response:**

```json
{
  "message": "Lấy thống kê theo môn học thành công",
  "data": {
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "subject": "MATH",
    "totalQuestions": 250,
    "questionsAnswered": 80,
    "correctAnswers": 65,
    "incorrectAnswers": 15,
    "remainingQuestions": 170,
    "progressPercentage": 32,
    "accuracyPercentage": 81
  }
}
```

### 7. Lấy thống kê chi tiết theo loại câu hỏi

**GET** `/api/practice-result/stats-by-type?subject=MATH`

**Query Parameters:**

- `subject` (optional): "MATH" | "ENGLISH" - Nếu không có sẽ lấy tất cả môn

**Response:**

```json
{
  "message": "Lấy thống kê theo loại câu hỏi thành công",
  "data": {
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "subject": "MATH",
    "statsByQuestionType": [
      {
        "_id": "algebra_linear_equations_in_one_variable",
        "questionTypeName": "algebra;linear equations in one variable",
        "totalQuestions": 25,
        "answeredQuestions": 15,
        "correctAnswers": 12,
        "incorrectAnswers": 3,
        "remainingQuestions": 10,
        "progressPercentage": 60,
        "accuracyPercentage": 80
      },
      {
        "_id": "advanced_math_equivalent_expressions",
        "questionTypeName": "advanced math;equivalent expressions",
        "totalQuestions": 20,
        "answeredQuestions": 8,
        "correctAnswers": 6,
        "incorrectAnswers": 2,
        "remainingQuestions": 12,
        "progressPercentage": 40,
        "accuracyPercentage": 75
      }
    ]
  }
}
```

### 8. Lấy lịch sử làm bài gần đây

**GET** `/api/practice-result/history?page=1&limit=20`

**Query Parameters:**

- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số bản ghi mỗi trang (default: 20)

**Response:**

```json
{
  "message": "Lấy lịch sử làm bài thành công",
  "data": {
    "history": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "questionId": "64f1a2b3c4d5e6f7g8h9i0j2",
        "userId": "64f1a2b3c4d5e6f7g8h9i0j3",
        "isCorrect": true,
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T10:00:00.000Z",
        "questionData": {
          "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
          "contentQuestion": "Giải phương trình: 2x + 5 = 15",
          "subject": "MATH",
          "difficulty": "EASY",
          "questionType": {
            "text": "algebra;linear equations in one variable",
            "code": "algebra_linear_equations_in_one_variable"
          }
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalItems": 150,
      "itemsPerPage": 20
    }
  }
}
```

### 9. Lưu kết quả làm bài

**POST** `/api/practice-result/save`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "questionId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "isCorrect": true
}
```

**Response:**

```json
{
  "message": "Lưu kết quả thành công",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "questionId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "userId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "isCorrect": true,
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
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

1. `questionId`: Bắt buộc, phải tồn tại trong QuestionBanks
2. `isCorrect`: Bắt buộc, phải là boolean
3. `subject`: Phải là "MATH" hoặc "ENGLISH"

## Features

### Duplicate Prevention

- Mỗi user chỉ có thể có 1 kết quả cho 1 câu hỏi
- Sử dụng upsert để cập nhật kết quả mới nhất

### Performance Optimization

- Sử dụng MongoDB aggregation pipeline cho thống kê phức tạp
- Index được tối ưu cho userId và questionId
- Pagination cho lịch sử làm bài

### Comprehensive Statistics

- Thống kê tổng quan: tổng số câu, đã làm, đúng, sai, phần trăm
- Thống kê theo môn học: MATH/ENGLISH riêng biệt
- Thống kê theo loại câu hỏi: chi tiết từng category
- Lịch sử làm bài: theo thời gian gần nhất

## Examples

### Ví dụ nộp bài luyện tập

```javascript
const submitPractice = async (userAnswers, questions) => {
  const response = await fetch("/api/practice-result/submit", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userAnswers: userAnswers, // Object: { "questionId": "userAnswer" }
      questions: questions, // Array: ["questionId1", "questionId2", ...]
    }),
  });

  const data = await response.json();
  console.log("Practice result:", data.data);
  console.log("Accuracy:", data.data.accuracy + "%");

  // Log each question result
  data.data.results.forEach((result) => {
    console.log(
      `Question ${result.questionId}: ${
        result.isCorrect ? "Correct" : "Wrong"
      } (Answer: ${result.userAnswer})`
    );
  });
};

// Sử dụng:
const userAnswers = {
  "64f1a2b3c4d5e6f7g8h9i0j1": "A",
  "64f1a2b3c4d5e6f7g8h9i0j2": "B",
  "64f1a2b3c4d5e6f7g8h9i0j3": "C",
};
const questions = [
  "64f1a2b3c4d5e6f7g8h9i0j1",
  "64f1a2b3c4d5e6f7g8h9i0j2",
  "64f1a2b3c4d5e6f7g8h9i0j3",
];
submitPractice(userAnswers, questions);
```

### Ví dụ luyện tập theo dạng bài

```javascript
const practiceByQuestionType = async (
  questionType,
  numberOfQuestions = 10,
  subject = null
) => {
  const body = {
    questionType: questionType,
    numberOfQuestions: numberOfQuestions,
  };

  if (subject) {
    body.subject = subject;
  }

  const response = await fetch("/api/practice-result/practice-by-type", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.data.actualQuestions === 0) {
    const subjectText = subject ? ` môn ${subject}` : "";
    console.log(
      `Không có câu hỏi sai nào cho dạng bài: ${data.data.questionTypeName}${subjectText}`
    );
    return data;
  }

  const subjectText =
    data.data.subject !== "ALL" ? ` môn ${data.data.subject}` : "";
  console.log(
    `Luyện tập dạng bài: ${data.data.questionTypeName}${subjectText}`
  );
  console.log(
    `Có ${data.data.totalAvailable} câu sai, lấy ${data.data.actualQuestions} câu`
  );

  // Log stats
  console.log("\nThống kê đề luyện:");
  console.log(`- Toán: ${data.data.stats.mathQuestions} câu`);
  console.log(`- Tiếng Anh: ${data.data.stats.englishQuestions} câu`);
  console.log(`- Dễ: ${data.data.stats.easyQuestions} câu`);
  console.log(`- Trung bình: ${data.data.stats.mediumQuestions} câu`);
  console.log(`- Khó: ${data.data.stats.hardQuestions} câu`);

  // Log suggestion if available
  if (data.data.suggestion) {
    console.log("\nGợi ý:", data.data.suggestion);
  }

  return data;
};

// Sử dụng:
// Luyện tập phương trình bậc nhất (tất cả môn)
practiceByQuestionType("algebra_linear_equations_in_one_variable", 5);

// Luyện tập phương trình bậc nhất chỉ môn MATH
practiceByQuestionType("algebra_linear_equations_in_one_variable", 5, "MATH");

// Luyện tập ngữ pháp tiếng Anh chỉ môn ENGLISH
practiceByQuestionType(
  "standard_english_conventions_form_structure_and_sense",
  10,
  "ENGLISH"
);

// Luyện tập hình học chỉ môn MATH
practiceByQuestionType("advanced_math_equivalent_expressions", 3, "MATH");

// Luyện tập reading comprehension chỉ môn ENGLISH
practiceByQuestionType(
  "information_and_ideas_central_ideas_and_details",
  8,
  "ENGLISH"
);

// Lấy nhiều câu hỏi (tối đa 50)
practiceByQuestionType("algebra_linear_equations_in_one_variable", 20, "MATH");
```

### 4. Cập nhật trạng thái practice result

**PUT** `/api/practice-result/update-status`

Cập nhật trạng thái luyện tập của một câu hỏi (đã học hoặc cần ôn lại).

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "questionId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "status": "learned"
}
```

**Parameters:**

- `questionId` (required): ID của câu hỏi
- `status` (required): "need_to_review" | "learned" - Trạng thái mới

**Response:**

```json
{
  "message": "Cập nhật trạng thái thành 'learned' thành công",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "questionId": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "contentQuestion": "Giải phương trình: 2x + 5 = 15",
      "questionType": {
        "text": "Algebra;Linear equations in one variable",
        "code": "algebra_linear_equations_in_one_variable"
      }
    },
    "userId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "isCorrect": false,
    "status": "learned",
    "updatedAt": "2024-01-20T11:00:00.000Z"
  }
}
```

### 5. Cập nhật trạng thái hàng loạt

**PUT** `/api/practice-result/update-multiple-status`

Cập nhật trạng thái luyện tập cho nhiều câu hỏi cùng lúc.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "updates": [
    {
      "questionId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "status": "learned"
    },
    {
      "questionId": "64f1a2b3c4d5e6f7g8h9i0j2",
      "status": "need_to_review"
    },
    {
      "questionId": "64f1a2b3c4d5e6f7g8h9i0j3",
      "status": "learned"
    }
  ]
}
```

**Parameters:**

- `updates` (required): Array of objects containing questionId and status
- Maximum 100 updates per request

**Response:**

```json
{
  "message": "Cập nhật trạng thái cho 3 câu hỏi thành công",
  "data": {
    "totalUpdates": 3,
    "successfulUpdates": 3,
    "results": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "questionId": "64f1a2b3c4d5e6f7g8h9i0j2",
        "questionContent": "Giải phương trình: 2x + 5 = 15",
        "questionType": {
          "text": "Algebra;Linear equations in one variable",
          "code": "algebra_linear_equations_in_one_variable"
        },
        "subject": "MATH",
        "difficulty": "EASY",
        "userId": "64f1a2b3c4d5e6f7g8h9i0j3",
        "isCorrect": false,
        "status": "learned",
        "updatedAt": "2024-01-20T11:00:00.000Z"
      }
    ]
  }
}
```

### Ví dụ luyện tập tất cả dạng bài

```javascript
const practiceAllIncorrect = async (numberOfQuestions = 10, subject = null) => {
  const body = { numberOfQuestions };
  if (subject) {
    body.subject = subject;
  }

  const response = await fetch("/api/practice-result/practice-all", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.data.actualQuestions === 0) {
    console.log("Không có câu hỏi sai nào để luyện tập");
    return data;
  }

  console.log(`Luyện tập tất cả dạng bài${subject ? ` môn ${subject}` : ""}`);
  console.log(
    `Có ${data.data.totalAvailable} câu sai, lấy ${data.data.actualQuestions} câu`
  );

  // Log distribution by subject
  console.log("\nPhân bố theo môn học:");
  data.data.distribution.forEach((subjectData) => {
    console.log(`- ${subjectData._id}: ${subjectData.totalBySubject} câu sai`);
    subjectData.difficulties.forEach((diff) => {
      console.log(`  + ${diff.difficulty}: ${diff.count} câu`);
    });
  });

  // Log current practice stats
  console.log("\nThống kê đề luyện này:");
  console.log(`- Toán: ${data.data.stats.mathQuestions} câu`);
  console.log(`- Tiếng Anh: ${data.data.stats.englishQuestions} câu`);
  console.log(`- Dễ: ${data.data.stats.easyQuestions} câu`);
  console.log(`- Trung bình: ${data.data.stats.mediumQuestions} câu`);
  console.log(`- Khó: ${data.data.stats.hardQuestions} câu`);

  // Log suggestion if available
  if (data.data.suggestion) {
    console.log("\nGợi ý:", data.data.suggestion);
  }

  return data;
};

// Sử dụng:
// Luyện tập tất cả dạng bài (cả MATH và ENGLISH)
practiceAllIncorrect(15);

// Luyện tập tất cả dạng bài môn MATH
practiceAllIncorrect(10, "MATH");

// Luyện tập tất cả dạng bài môn ENGLISH
practiceAllIncorrect(8, "ENGLISH");

// Luyện tập nhiều câu hỏi (tối đa 50)
practiceAllIncorrect(50);

// Test với số câu ít
practiceAllIncorrect(5, "MATH");
```

### Ví dụ lấy danh sách câu hỏi sai

```javascript
const getIncorrectQuestions = async (filters = {}) => {
  const { page = 1, limit = 20, subject, questionType, difficulty } = filters;

  const queryParams = new URLSearchParams();
  if (page) queryParams.append("page", page);
  if (limit) queryParams.append("limit", limit);
  if (subject) queryParams.append("subject", subject);
  if (questionType) queryParams.append("questionType", questionType);
  if (difficulty) queryParams.append("difficulty", difficulty);

  const response = await fetch(
    `/api/practice-result/incorrect-questions?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  const data = await response.json();
  console.log("Incorrect questions:", data.data.incorrectQuestions);
  console.log("Total incorrect:", data.data.summary.totalIncorrectQuestions);

  // Log summary by subject
  data.data.summary.bySubject.forEach((subjectData) => {
    console.log(
      `${subjectData._id}: ${subjectData.totalBySubject} incorrect questions`
    );
    subjectData.difficulties.forEach((diff) => {
      console.log(`  - ${diff.difficulty}: ${diff.count} questions`);
    });
  });

  return data;
};

// Sử dụng:
// Lấy tất cả câu sai
getIncorrectQuestions();

// Lấy câu sai của môn MATH
getIncorrectQuestions({ subject: "MATH" });

// Lấy câu sai độ khó HARD của môn ENGLISH
getIncorrectQuestions({
  subject: "ENGLISH",
  difficulty: "HARD",
  page: 1,
  limit: 10,
});

// Lấy câu sai của loại câu hỏi cụ thể
getIncorrectQuestions({
  questionType: "algebra_linear_equations_in_one_variable",
});
```

### Ví dụ lưu kết quả làm bài

```javascript
const savePracticeResult = async (questionId, isCorrect) => {
  const response = await fetch("/api/practice-result/save", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      questionId: questionId,
      isCorrect: isCorrect,
    }),
  });

  const data = await response.json();
  console.log(data);
};
```

### Ví dụ lấy thống kê tổng quan

```javascript
const getOverallStats = async () => {
  const response = await fetch("/api/practice-result/stats", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  const data = await response.json();
  console.log("Progress:", data.data.progressPercentage + "%");
  console.log("Accuracy:", data.data.accuracyPercentage + "%");
};
```

### Ví dụ lấy thống kê theo môn

```javascript
const getMathStats = async () => {
  const response = await fetch("/api/practice-result/stats/MATH", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  const data = await response.json();
  console.log("Math progress:", data.data);
};
```

### Ví dụ lấy thống kê chi tiết

```javascript
const getDetailedStats = async () => {
  const response = await fetch(
    "/api/practice-result/stats-by-type?subject=MATH",
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  const data = await response.json();
  data.data.statsByQuestionType.forEach((stat) => {
    console.log(`${stat._id}: ${stat.accuracyPercentage}% accuracy`);
  });
};
```

### Ví dụ lấy lịch sử làm bài

```javascript
const getRecentHistory = async () => {
  const response = await fetch("/api/practice-result/history?page=1&limit=10", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  const data = await response.json();
  console.log("Recent practice history:", data.data.history);
};

practiceAllIncorrect(30); // Lấy 30 câu từ tất cả môn
practiceAllIncorrect(15, "ENGLISH"); // Lấy 15 câu chỉ môn Tiếng Anh
practiceAllIncorrect(25, "MATH"); // Lấy 25 câu chỉ môn Toán
```

### Ví dụ cập nhật trạng thái

```javascript
// Cập nhật trạng thái một câu hỏi
const updatePracticeStatus = async (questionId, status) => {
  const response = await fetch("/api/practice-result/update-status", {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      questionId: questionId,
      status: status,
    }),
  });

  const data = await response.json();

  if (data.data) {
    console.log(`Đã cập nhật câu hỏi thành trạng thái: ${data.data.status}`);
    console.log(`Question: ${data.data.questionId.contentQuestion}`);
    console.log(`Is Correct: ${data.data.isCorrect}`);
  }

  return data;
};

// Cập nhật trạng thái hàng loạt
const updateMultiplePracticeStatus = async (updates) => {
  const response = await fetch("/api/practice-result/update-multiple-status", {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      updates: updates,
    }),
  });

  const data = await response.json();

  if (data.data) {
    console.log(
      `Cập nhật thành công ${data.data.successfulUpdates}/${data.data.totalUpdates} câu hỏi`
    );

    // Log summary by status
    const statusSummary = data.data.results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});

    console.log("Tóm tắt trạng thái:");
    console.log(`- Đã học: ${statusSummary.learned || 0} câu`);
    console.log(`- Cần ôn lại: ${statusSummary.need_to_review || 0} câu`);
  }

  return data;
};

// Sử dụng:
// Đánh dấu đã học một câu hỏi
updatePracticeStatus("64f1a2b3c4d5e6f7g8h9i0j1", "learned");

// Đánh dấu cần ôn lại một câu hỏi
updatePracticeStatus("64f1a2b3c4d5e6f7g8h9i0j2", "need_to_review");

// Cập nhật hàng loạt nhiều câu hỏi
const bulkUpdates = [
  { questionId: "64f1a2b3c4d5e6f7g8h9i0j1", status: "learned" },
  { questionId: "64f1a2b3c4d5e6f7g8h9i0j2", status: "learned" },
  { questionId: "64f1a2b3c4d5e6f7g8h9i0j3", status: "need_to_review" },
  { questionId: "64f1a2b3c4d5e6f7g8h9i0j4", status: "learned" },
];

updateMultiplePracticeStatus(bulkUpdates);

// Workflow hoàn chỉnh: Đánh dấu tất cả câu sai của dạng bài đã luyện
const markQuestionTypeAsLearned = async (questionType, subject = null) => {
  // 1. Lấy câu hỏi sai theo dạng bài
  const practiceResponse = await practiceByQuestionType(
    questionType,
    50,
    subject
  );

  if (practiceResponse.data.questions.length === 0) {
    console.log("Không có câu hỏi sai nào để đánh dấu");
    return;
  }

  // 2. Chuẩn bị updates để đánh dấu tất cả là "learned"
  const updates = practiceResponse.data.questions.map((item) => ({
    questionId: item.questionId,
    status: "learned",
  }));

  // 3. Cập nhật hàng loạt
  const updateResponse = await updateMultiplePracticeStatus(updates);

  console.log(
    `Đã đánh dấu học xong ${updateResponse.data.successfulUpdates} câu hỏi dạng bài: ${questionType}`
  );

  return updateResponse;
};

// Sử dụng workflow
markQuestionTypeAsLearned("algebra_linear_equations_in_one_variable", "MATH");
```
