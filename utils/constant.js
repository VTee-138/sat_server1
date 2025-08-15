const ADMIN_ROLE = 1;
const USER_ROLE = 0;
const OK = 200;
const NO_CONTENT = 204;
const UNAUTHORIZED = 401;
const BAD_REQUEST = 400;
const FORBIDDEN = 403;
const NOT_FOUND = 400;
const TOO_MANY_REQUESTS = 429;
const INTERNAL_SERVER_ERROR = 500;
const EXPIRESIN = "72h";
const AUTH_USERNAME = "10sat";
const AUTH_PASSWORD = "10sat@123456789";
const JWT_SECRET = "cdsj32kld&&10sat";
const SECRET_KEY = "10sat@123456789";
const ROLES = [0, 1];
const LIST_EXAMS_DANHGIA = ["TSA", "HSA", "APT"];
const ACCESS_PUBLIC = "PUBLIC";
const ACCESS_PRIVATE = "PRIVATE";
const LIST_QUESTION_TYPE = [
  "craft_and_structure_cross_text_connections",
  "craft_and_structure_text_structure_and_purpose",
  "craft_and_structure_words_in_context",
  "expression_of_ideas_rhetorical_synthesis",
  "expression_of_ideas_transitions",
  "information_and_ideas_central_ideas_and_details",
  "information_and_ideas_command_of_evidence",
  "information_and_ideas_inferences",
  "standard_english_conventions_boundaries",
  "standard_english_conventions_form_structure_and_sense",
  "algebra_linear_equations_in_one_variable",
  "algebra_linear_functions",
  "algebra_linear_equations_in_two_variables",
  "algebra_systems_of_two_linear_equations_in_two_variables",
  "algebra_linear_inequalities_in_one_or_two_variables",
  "advanced_math_equivalent_expressions",
  "advanced_math_nonlinear_equations_in_one_variable_and_systems_of_equations_in_two_variables",
  "advanced_math_nonlinear_functions",
  "problem_solving_and_data_analysis_ratios_rates_proportional_relationships_and_units",
  "problem_solving_and_data_analysis_percentages",
  "problem_solving_and_data_analysis_one_variable_data_distributions_and_measures_of_center_and_spread",
  "problem_solving_and_data_analysis_two_variable_data_models_and_scatterplots",
];
module.exports = {
  LIST_QUESTION_TYPE,
  ADMIN_ROLE,
  USER_ROLE,
  OK,
  NO_CONTENT,
  UNAUTHORIZED,
  BAD_REQUEST,
  FORBIDDEN,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  INTERNAL_SERVER_ERROR,
  EXPIRESIN,
  AUTH_USERNAME,
  AUTH_PASSWORD,
  JWT_SECRET,
  SECRET_KEY,
  ROLES,
  LIST_EXAMS_DANHGIA,
  ACCESS_PUBLIC,
  ACCESS_PRIVATE,
};
