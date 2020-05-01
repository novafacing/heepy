@{%
const lexer = require('./lexer.js')
%}

@lexer lexer

translation_unit ->
    external_declaration:*

external_declaration ->
    function_definition
    | declaration

function_definition ->
    declaration_specifiers declarator declaration_list compound_statement
    | declaration_specifiers declarator compound_statement
    | declarator declaration_list compound_statement
    | declarator compound_statement

declaration_specifiers ->
    storage_class_specifier
    | storage_class_specifier declaration_specifiers
    | type_specifier
    | type_specifier declaration_specifiers
    | type_qualifier
    | type_qualifier declaration_specifiers

declaration_specifier ->
    storage_class_specifier
    | type_specifier
    | type_qualifier

storage_class_specifier ->
    %tk_typedef
    | %tk_extern
    | %tk_static
    | %tk_auto
    | %tk_register

type_specifier ->
    %tk_void
    | %tk_char
    | %tk_short
    | %tk_int
    | %tk_long
    | %tk_float
    | %tk_double
    | %tk_signed
    | %tk_unsigned
    | struct_or_union_specifier
    | enum_specifier
    | type_name

struct_or_union_specifier ->
    struct_or_union _ %tk_identifier _ "{" _ struct_declaration_list _ "}" 
    | struct_or_union _ "{" _ struct_declaration_list _ "}"
    | struct_or_union _ %tk_identifier

struct_or_union ->
    %tk_struct
    | %tk_union

struct_declaration_list ->
    struct_declaration
    | struct_declaration_list struct_declaration

struct_declaration ->
    specifier_qualifier_list _ struct_declarator_list _ ";"

specifier_qualifier_list ->
    type_specifier specifier_qualifier_list
    | type_specifier
    | type_qualifier specifier_qualifier_list
    | type_qualifier
    

specifier_qualifier ->
    type_specifier
    | type_qualifier

struct_declarator_list ->
    struct_declarator
    | struct_declarator_list _ "," _ struct_declarator

struct_declarator ->
    declarator
    | declarator _ ":" _ constant_expression
    | ":" _ constant_expression

declarator ->
    pointer:? _ direct_declarator

pointer ->
    "*" _ type_qualifier:* _ pointer:?

type_qualifier ->
    %tk_const
    | %tk_volatile

direct_declarator ->
    %tk_identifier
    | "(" _ declarator _ ")"
    | direct_declarator _ "[" _ constant_expression:? _ "]"
    | direct_declarator _ "(" _ parameter_type_list _ ")"
    | direct_declarator _ "(" _ %tk_identifier:* _ ")"

constant_expression ->
    conditional_expression

conditional_expression ->
    logical_or_expression
    | logical_or_expression _ "?" _ expression _ ":" _ conditional_expression

logical_or_expression ->
    logical_and_expression
    | logical_or_expression _ %tk_or_op _ logical_and_expression

logical_and_expression -> 
    inclusive_or_expression
    | logical_and_expression _ %tk_and_op _ inclusive_or_expression

inclusive_or_expression ->
    exclusive_or_expression
    | inclusive_or_expression _ "|" _ exclusive_or_expression

exclusive_or_expression ->
    and_expression
    | exclusive_or_expression _ "^" _ and_expression

and_expression -> 
    equality_expression
    | and_expression _ "&" _ equality_expression

equality_expression ->
    relational_expression
    | equality_expression _ %tk_eq_op _ relational_expression
    | equality_expression _ %tk_neq_op _ relational_expression

relational_expression ->
    shift_expression
    | relational_expression _ "<" _ shift_expression
    | relational_expression _ ">" _ shift_expression
    | relational_expression _ %tk_leq_op _ shift_expression
    | relational_expression _ %tk_geq_op _ shift_expression

shift_expression -> 
    additive_expression
    | shift_expression _ %tk_left_op _ additive_expression
    | shift_expression _ %tk_right_op _ additive_expression

additive_expression ->
    multiplicative_expression
    | additive_expression _ "+" _ multiplicative_expression
    | additive_expression _ "-" _ multiplicative_expression

multiplicative_expression ->
    cast_expression
    | multiplicative_expression _ "*" _ cast_expression
    | multiplicative_expression _ "/" _ cast_expression
    | multiplicative_expression _ "%" _ cast_expression

cast_expression ->
    unary_expression
    | "(" _ type_name _ ")" _ cast_expression


unary_expression ->
    postfix_expression
    | %tk_inc_op _ unary_expression
    | %tk_dec_op _ unary_expression
    | unary_operator _ cast_expression
    | %tk_sizeof _ unary_expression
    | %tk_sizeof _ type_name

postfix_expression ->
    primary_expression
    | postfix_expression _ "[" _ expression _ "]"
    | postfix_expression _ "(" _ ")"
    | postfix_expression _ "(" _ argument_expression_list _ ")"
    | postfix_expression _ "." _ %tk_identifier
    | postfix_expression _ %tk_ptr_op _ %tk_identifier
    | postfix_expression _ %tk_inc_op
    | postfix_expression _ %tk_dec_op

argument_expression_list ->
    assignment_expression
    | argument_expression_list _ ',' _ assignment_expression

primary_expression ->
    %tk_identifier
    | %tk_constant
    | %tk_string_literal
    | "(" _ expression _ ")"

constant ->
    %tk_integer_constant
    | %tk_character_constant
    | %tk_floating_constant
    | %tk_enumeration_constant

expression ->
    assignment_expression
    | expression _ "," _ assignment_expression

assignment_expression ->
    conditional_expression
    | unary_expression _ assignment_operator _ assignment_expression

assignment_operator ->
    "="
    | %tk_right_assign
    | %tk_left_assign
    | %tk_add_assign
    | %tk_sub_assign
    | %tk_mul_assign
    | %tk_div_assign
    | %tk_mod_assign
    | %tk_and_assign
    | %tk_xor_assign
    | %tk_or_assign

unary_operator ->
    "&"
    | "*"
    | "+"
    | "-"
    | "~"
    | "!"

type_name ->
    specifier_qualifier:+ _ abstract_declarator:?

parameter_type_list ->
    parameter_list
    | parameter_list _ "," _ "..."

parameter_list ->
    parameter_declaration
    | parameter_list _ "," _ parameter_declaration

parameter_declaration ->
    declaration_specifier:+ _ declarator
    | declaration_specifier:+ _ abstract_declarator
    | declaration_specifier:+

abstract_declarator ->
    pointer
    | pointer _ direct_abstract_declarator
    | direct_abstract_declarator

direct_abstract_declarator ->
    "(" _ abstract_declarator _ ")"
    | direct_abstract_declarator:? _ "[" _ constant_expression:? _ "]"
    | direct_abstract_declarator:? _ "(" _ parameter_type_list:? _ ")"

enum_specifier ->
    %tk_enum _ %tk_identifier _ "{" _ enumerator_list "}"
    | %tk_enum _ "{" _ enumerator_list _ "}"
    | %tk_enum _ %tk_identifier

enumerator_list ->
    enumerator
    | enumerator_list _ "," _ enumerator

enumerator ->
    %tk_identifier
    | %tk_identifier _ "=" _ constant_expression

typedef_name ->
    %tk_identifier

declaration ->
    declaration_specifiers _ ';'
    | declaration_specifiers _ init_declarator_list _ ';'

init_declarator_list ->
    init_declarator
    | init_declarator_list _ ',' _ init_declarator

init_declarator ->
    declarator
    | declarator _ "=" _ initializer

initializer -> 
    assignment_expression
    | "{" _ initializer_list _ "}"
    | "{" initializer_list _ "," _ "}"

initializer_list ->
    initializer
    | initializer_list _ "," _ initializer

compound_statement ->
    "{" _ declaration:* _ statement:* _ "}"

statement ->
    labeled_statement
    | expression_statement
    | compound_statement
    | selection_statement
    | iteration_statement
    | jump_statement

labeled_statement ->
    %tk_identifier _ ":" _ statement
    | %tk_case _ constant_expression _ ":" _ statement
    | %tk_default _ ":" _ statement

expression_statement ->
    expression:? _ ";"

selection_statement ->
    %tk_if _ "(" _ expression _ ")" _ statement
    | %tk_if _ "(" _ expression _ ")" _ statement _ %tk_else statement
    | %tk_switch _ "(" _ expression _ ")" _ statement

iteration_statement -> 
    %tk_while _ "(" _ expression _ ")" _ statement
    | %tk_do statement _ %tk_while _ "(" _ expression _ ")" _ ";"
    | %tk_for _ "(" _ expression:? _ ";" _ expression:? _ ";" _ expression:? _ ")" _ statement

jump_statement ->
    %tk_goto _ %tk_identifier _ ";"
    | %tk_continue _ ";"
    | %tk_break _ ";"
    | %tk_return _ expression:? _ ";"

_ ->
    %tk_ws:?
    | null
    | _ %tk_p_comment _
