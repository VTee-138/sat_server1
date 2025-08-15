const mongoose = require("mongoose");
const QuestionBankSchema = new mongoose.Schema(
  {
    contentQuestion: {
      type: String,
      required: true,
    },

    contentQuestionNormalized: {
      type: String,
      required: true,
      index: true, // Index cho việc tìm kiếm nhanh
    },

    contentAnswer: {
      type: Object,
      required: false,
    },

    correctAnswer: {
      type: Object,
      required: true,
    },

    subject: {
      type: String,
      required: true,
      enum: ["MATH", "ENGLISH"],
    },

    type: {
      type: String,
      required: true,
      enum: ["TN", "TLN"],
    },

    explanation: {
      type: String,
      required: false,
    },

    difficulty: {
      type: String,
      required: true,
      enum: ["EASY", "MEDIUM", "HARD"],
    },

    questionType: {
      type: Object,
      required: true,
      text: {
        type: String,
        required: true,
        // enum: [
        //   "Craft and Structure;Cross-Text Connections",
        //   "Craft and Structure;Text Structure and Purpose",
        //   "Craft and Structure;Words in Context",
        //   "Expression of Ideas;Rhetorical Synthesis",
        //   "Expression of Ideas;Transitions",
        //   "Information and Ideas;Central Ideas and Details",
        //   "Information and Ideas;Command of Evidence",
        //   "Information and Ideas;Inferences",
        //   "Standard English Conventions;Boundaries",
        //   "Standard English Conventions;Form, Structure, and Sense",
        //   "Algebra;Linear equations in one variable",
        //   "Algebra;Linear functions",
        //   "Algebra;Linear equations in two variables",
        //   "Algebra;Systems of two linear equations in two variables",
        //   "Algebra;Linear inequalities in one or two variables",
        //   "Advanced Math;Equivalent expressions",
        //   "Advanced Math;Nonlinear equations in one variable and systems of equations in two variables",
        //   "Advanced Math;Nonlinear functions",
        //   "Problem-Solving and Data Analysis;Ratios, rates, proportional relationships, and units",
        //   "Problem-Solving and Data Analysis;Percentages",
        //   "Problem-Solving and Data Analysis;One-variable data: Distributions and measures of center and spread",
        //   "Problem-Solving and Data Analysis;Two-variable data: Models and scatterplots",
        // ],
      },
      code: {
        type: String,
        required: true,
        // enum: [
        //   "craft_and_structure_cross_text_connections",
        //   "craft_and_structure_text_structure_and_purpose",
        //   "craft_and_structure_words_in_context",
        //   "expression_of_ideas_rhetorical_synthesis",
        //   "expression_of_ideas_transitions",
        //   "information_and_ideas_central_ideas_and_details",
        //   "information_and_ideas_command_of_evidence",
        //   "information_and_ideas_inferences",
        //   "standard_english_conventions_boundaries",
        //   "standard_english_conventions_form_structure_and_sense",
        //   "algebra_linear_equations_in_one_variable",
        //   "algebra_linear_functions",
        //   "algebra_linear_equations_in_two_variables",
        //   "algebra_systems_of_two_linear_equations_in_two_variables",
        //   "algebra_linear_inequalities_in_one_or_two_variables",
        //   "advanced_math_equivalent_expressions",
        //   "advanced_math_nonlinear_equations_in_one_variable_and_systems_of_equations_in_two_variables",
        //   "advanced_math_nonlinear_functions",
        //   "problem_solving_and_data_analysis_ratios_rates_proportional_relationships_and_units",
        //   "problem_solving_and_data_analysis_percentages",
        //   "problem_solving_and_data_analysis_one_variable_data_distributions_and_measures_of_center_and_spread",
        //   "problem_solving_and_data_analysis_two_variable_data_models_and_scatterplots",
        // ],
      },
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "question_banks" }
);

// Middleware để cập nhật `updatedAt` trước khi lưu mới
QuestionBankSchema.pre("save", function (next) {
  if (this.isNew) {
    this.createdAt = Date.now();
  }
  this.updatedAt = Date.now();
  next();
});

// Middleware để cập nhật `updatedAt` trước khi update
function updateTimestamp(next) {
  this.set({ updatedAt: Date.now() });
  next();
}

QuestionBankSchema.pre("findOneAndUpdate", updateTimestamp);
QuestionBankSchema.pre("updateOne", updateTimestamp);
QuestionBankSchema.pre("updateMany", updateTimestamp);
QuestionBankSchema.pre("findByIdAndUpdate", updateTimestamp);

// Tạo unique index cho contentQuestionNormalized để đảm bảo không trùng lặp
QuestionBankSchema.index({ contentQuestionNormalized: 1 }, { unique: true });

module.exports = mongoose.model("QuestionBanks", QuestionBankSchema);
