%lex

%options easy_keyword_rules

%{
    yy.types = [
        'mfastbinptr',
        'mchunkptr',
        'INTERNAL_SIZE_T'
    ];
    yy.enumConstants = [];
    yy.vars = [];
%}

O   [0-7]
D   [0-9]
NZ  [1-9]
L   [a-zA-Z_]
A   [a-zA-Z_0-9]
H   [a-fA-F0-9]
HP  (0[xX])
E   ([Ee][+-]?{D}+)
P   ([Pp][+-]?{D}+)
FS  (f|F|l|L)
IS  (((u|U)(l|L|ll|LL)?)|((l|L|ll|LL)(u|U)?))
CP  (u|U|L)
SP  (u8|u|U|L)
ES  (\\(['"\?\\abfnrtv]|[0-7]{1,3}|x[a-fA-F0-9]+))
WS  [ \t\v\n\f]

%%



"/*"[^*]*"*"(?:[^/*][^*]*"*"+)*"/"     /* ignore */
"//".*                                  /* ignore */
"auto"                                  %{
                                            console.log(yytext);
                                            return 'AUTO'; 
                                        %}
"break"                                 %{
                                            console.log(yytext);
                                            return 'BREAK'; 
                                        %}
"case"                                  %{
                                            console.log(yytext);
                                            return 'CASE'; 
                                        %}
"char"                                  %{
                                            console.log(yytext);
                                            return 'CHAR'; 
                                        %}
"const"                                 %{
                                            console.log(yytext);
                                            return 'CONST'; 
                                        %}
"continue"                              %{
                                            console.log(yytext);
                                            return 'CONTINUE'; 
                                        %}
"default"                               %{
                                            console.log(yytext);
                                            return 'DEFAULT'; 
                                        %}
"do"                                    %{
                                            console.log(yytext);
                                            return 'DO'; 
                                        %}
"double"                                %{
                                            console.log(yytext);
                                            return 'DOUBLE'; 
                                        %}
"else"                                  %{
                                            console.log(yytext);
                                            return 'ELSE'; 
                                        %}
"enum"                                  %{
                                            console.log(yytext);
                                            return 'ENUM'; 
                                        %}
"extern"                                %{
                                            console.log(yytext);
                                            return 'EXTERN'; 
                                        %}
"float"                                 %{
                                            console.log(yytext);
                                            return 'FLOAT'; 
                                        %}
"for"                                   %{
                                            console.log(yytext);
                                            return 'FOR'; 
                                        %}
"goto"                                  %{
                                            console.log(yytext);
                                            return 'GOTO'; 
                                        %}
"if"                                    %{
                                            console.log(yytext);
                                            return 'IF'; 
                                        %}
"inline"                                %{
                                            console.log(yytext);
                                            return 'INLINE'; 
                                        %}
"int"                                   %{
                                            console.log(yytext);
                                            return 'INT'; 
                                        %}
"long"                                  %{
                                            console.log(yytext);
                                            return 'LONG'; 
                                        %}
"register"                              %{
                                            console.log(yytext);
                                            return 'REGISTER'; 
                                        %}
"restrict"                              %{
                                            console.log(yytext);
                                            return 'RESTRICT'; 
                                        %}
"return"                                %{
                                            console.log(yytext);
                                            return 'RETURN'; 
                                        %}
"short"                                 %{
                                            console.log(yytext);
                                            return 'SHORT'; 
                                        %}
"signed"                                %{
                                            console.log(yytext);
                                            return 'SIGNED'; 
                                        %}
"sizeof"                                %{
                                            console.log(yytext);
                                            return 'SIZEOF'; 
                                        %}
"static"                                %{
                                            console.log(yytext);
                                            return 'STATIC'; 
                                        %}
"struct"                                %{
                                            console.log(yytext);
                                            return 'STRUCT'; 
                                        %}
"switch"                                %{
                                            console.log(yytext);
                                            return 'SWITCH'; 
                                        %}
"typedef"                               %{
                                            console.log(yytext);
                                            return 'TYPEDEF'; 
                                        %}
"union"                                 %{
                                            console.log(yytext);
                                            return 'UNION'; 
                                        %}
"unsigned"                              %{
                                            console.log(yytext);
                                            return 'UNSIGNED'; 
                                        %}
"void"                                  %{
                                            console.log(yytext);
                                            return 'VOID'; 
                                        %}
"volatile"                              %{
                                            console.log(yytext);
                                            return 'VOLATILE'; 
                                        %}
"while"                                 %{
                                            console.log(yytext);
                                            return 'WHILE'; 
                                        %}
"_Alignas"                              %{
                                            console.log(yytext);
                                            return 'ALIGNAS'; 
                                        %}
"_Alignof"                              %{
                                            console.log(yytext);
                                            return 'ALIGNOF'; 
                                        %}
"_Atomic"                               %{
                                            console.log(yytext);
                                            return 'ATOMIC'; 
                                        %}
"_Bool"                                 %{
                                            console.log(yytext);
                                            return 'BOOL'; 
                                        %}
"_Complex"                              %{
                                            console.log(yytext);
                                            return 'COMPLEX'; 
                                        %}
"_Generic"                              %{
                                            console.log(yytext);
                                            return 'GENERIC'; 
                                        %}
"_Imaginary"                            %{
                                            console.log(yytext);
                                            return 'IMAGINARY'; 
                                        %}
"_Noreturn"                             %{
                                            console.log(yytext);
                                            return 'NORETURN'; 
                                        %}
"_Static_assert"                        %{
                                            console.log(yytext);
                                            return 'STATIC_ASSERT'; 
                                        %}
"_Thread_local"                         %{
                                            console.log(yytext);
                                            return 'THREAD_LOCAL'; 
                                        %}
"__func__"                              %{
                                            console.log(yytext);
                                            return 'FUNC_NAME';
                                        %}

{L}{A}*					                %{
                                            if (yy.types.includes(yytext)) {
                                                console.log('TYPEDEF ', yytext);
                                                return 'TYPEDEF_NAME';
                                            } else if (yy.enumConstants.includes(yytext)) {
                                                console.log('ENUM CONSTANT ', yytext);
                                                return 'ENUMERATION_CONSTANT';
                                            } else {
                                                console.log('IDENTIFIER ', yytext);
                                                return 'IDENTIFIER';
                                            }
                                        %}

{HP}{H}+{IS}?				            %{
                                            console.log(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
{NZ}{D}*{IS}?				            %{
                                            console.log(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
"0"{O}*{IS}?				            %{
                                            console.log(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
{CP}?"'"([^'\\\n]|{ES})+"'"		        %{
                                            console.log(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
{D}+{E}{FS}?				            %{
                                            console.log(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{D}*"."{D}+{E}?{FS}?			        %{
                                            console.log(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{D}+"."{E}?{FS}?			            %{
                                            console.log(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{HP}{H}+{P}{FS}?			            %{
                                            console.log(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{HP}{H}*"."{H}+{P}{FS}?                 %{
                                            console.log(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{HP}{H}+"."{P}{FS}?                     %{
                                            console.log(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
({SP}?\"([^"\\\n]|{ES})*\"{WS}*)+       %{
                                            console.log(yytext);
                                            return 'STRING_LITERAL'; 
                                        %}

"..."                                   %{
                                            console.log(yytext);
                                            return 'ELLIPSIS'; 
                                        %}
">>="                                   %{
                                            console.log(yytext);
                                            return 'RIGHT_ASSIGN'; 
                                        %}
"<<="                                   %{
                                            console.log(yytext);
                                            return 'LEFT_ASSIGN'; 
                                        %}
"+="                                    %{
                                            console.log(yytext);
                                            return 'ADD_ASSIGN'; 
                                        %}
"-="                                    %{
                                            console.log(yytext);
                                            return 'SUB_ASSIGN'; 
                                        %}
"*="                                    %{
                                            console.log(yytext);
                                            return 'MUL_ASSIGN'; 
                                        %}
"/="                                    %{
                                            console.log(yytext);
                                            return 'DIV_ASSIGN'; 
                                        %}
"%="                                    %{
                                            console.log(yytext);
                                            return 'MOD_ASSIGN'; 
                                        %}
"&="                                    %{
                                            console.log(yytext);
                                            return 'AND_ASSIGN'; 
                                        %}
"^="                                    %{
                                            console.log(yytext);
                                            return 'XOR_ASSIGN'; 
                                        %}
"|="                                    %{
                                            console.log(yytext);
                                            return 'OR_ASSIGN'; 
                                        %}
">>"                                    %{
                                            console.log(yytext);
                                            return 'RIGHT_OP'; 
                                        %}
"<<"                                    %{
                                            console.log(yytext);
                                            return 'LEFT_OP'; 
                                        %}
"++"                                    %{
                                            console.log(yytext);
                                            return 'INC_OP'; 
                                        %}
"--"                                    %{
                                            console.log(yytext);
                                            return 'DEC_OP'; 
                                        %}
"->"                                    %{
                                            console.log(yytext);
                                            return 'PTR_OP'; 
                                        %}
"&&"                                    %{
                                            console.log(yytext);
                                            return 'AND_OP'; 
                                        %}
"||"                                    %{
                                            console.log(yytext);
                                            return 'OR_OP'; 
                                        %}
"<="                                    %{
                                            console.log(yytext);
                                            return 'LE_OP'; 
                                        %}
">="                                    %{
                                            console.log(yytext);
                                            return 'GE_OP'; 
                                        %}
"=="                                    %{
                                            console.log(yytext);
                                            return 'EQ_OP'; 
                                        %}
"!="                                    %{
                                            console.log(yytext);
                                            return 'NE_OP'; 
                                        %}
";"                                     %{
                                            console.log(yytext);
                                            return ';'; 
                                        %}
("{"|"<%")                              %{
                                            console.log(yytext);
                                            return '{'; 
                                        %}
("}"|"%>")                              %{
                                            console.log(yytext);
                                            return '}'; 
                                        %}
","                                     %{
                                            console.log(yytext);
                                            return ','; 
                                        %}
":"                                     %{
                                            console.log(yytext);
                                            return ':'; 
                                        %}
"="                                     %{
                                            console.log(yytext);
                                            return '='; 
                                        %}
"("                                     %{
                                            console.log(yytext);
                                            return '('; 
                                        %}
")"                                     %{
                                            console.log(yytext);
                                            return ')'; 
                                        %}
("["|"<:")                              %{
                                            console.log(yytext);
                                            return '['; 
                                        %}
("]"|":>")                              %{
                                            console.log(yytext);
                                            return ']'; 
                                        %}
"."                                     %{
                                            console.log(yytext);
                                            return '.'; 
                                        %}
"&"                                     %{
                                            console.log(yytext);
                                            return '&'; 
                                        %}
"!"                                     %{
                                            console.log(yytext);
                                            return '!'; 
                                        %}
"~"                                     %{
                                            console.log(yytext);
                                            return '~'; 
                                        %}
"-"                                     %{
                                            console.log(yytext);
                                            return '-'; 
                                        %}
"+"                                     %{
                                            console.log(yytext);
                                            return '+'; 
                                        %}
"*"                                     %{
                                            console.log(yytext);
                                            return '*'; 
                                        %}
"/"                                     %{
                                            console.log(yytext);
                                            return '/'; 
                                        %}
"%"                                     %{
                                            console.log(yytext);
                                            return '%'; 
                                        %}
"<"                                     %{
                                            console.log(yytext);
                                            return '<'; 
                                        %}
">"                                     %{
                                            console.log(yytext);
                                            return '>'; 
                                        %}
"^"                                     %{
                                            console.log(yytext);
                                            return '^'; 
                                        %}
"|"                                     %{
                                            console.log(yytext);
                                            return '|'; 
                                        %}
"?"                                     %{
                                            console.log(yytext);
                                            return '?'; 
                                        %}
{WS}+                                   /* ignore */
.                                       /* ignore */

/lex

%start translation_unit

%%

primary_expression
	: IDENTIFIER
	| constant
	| string
	| '(' expression ')'
	| generic_selection
	;

constant
	: I_CONSTANT		/* includes character_constant */
	| F_CONSTANT
	| ENUMERATION_CONSTANT	/* after it has been defined as such */
	;

enumeration_constant		/* before it has been defined as such */
	: IDENTIFIER
	;

string
	: STRING_LITERAL
	| FUNC_NAME
	;

generic_selection
	: GENERIC '(' assignment_expression ',' generic_assoc_list ')'
	;

generic_assoc_list
	: generic_association
	| generic_assoc_list ',' generic_association
	;

generic_association
	: type_name ':' assignment_expression
	| DEFAULT ':' assignment_expression
	;

postfix_expression
	: primary_expression
	| postfix_expression '[' expression ']'
	| postfix_expression '(' ')'
	| postfix_expression '(' argument_expression_list ')'
	| postfix_expression '.' IDENTIFIER
	| postfix_expression PTR_OP IDENTIFIER
	| postfix_expression INC_OP
	| postfix_expression DEC_OP
	| '(' type_name ')' '{' initializer_list '}'
	| '(' type_name ')' '{' initializer_list ',' '}'
	;

argument_expression_list
	: assignment_expression
	| argument_expression_list ',' assignment_expression
	;

unary_expression
	: postfix_expression
	| INC_OP unary_expression
	| DEC_OP unary_expression
	| unary_operator cast_expression
	| SIZEOF unary_expression
	| SIZEOF '(' type_name ')'
	| ALIGNOF '(' type_name ')'
	;

unary_operator
	: '&'
	| '*'
	| '+'
	| '-'
	| '~'
	| '!'
	;

cast_expression
	: unary_expression
	| '(' type_name ')' cast_expression
	;

multiplicative_expression
	: cast_expression
	| multiplicative_expression '*' cast_expression
	| multiplicative_expression '/' cast_expression
	| multiplicative_expression '%' cast_expression
	;

additive_expression
	: multiplicative_expression
	| additive_expression '+' multiplicative_expression
	| additive_expression '-' multiplicative_expression
	;

shift_expression
	: additive_expression
	| shift_expression LEFT_OP additive_expression
	| shift_expression RIGHT_OP additive_expression
	;

relational_expression
	: shift_expression
	| relational_expression '<' shift_expression
	| relational_expression '>' shift_expression
	| relational_expression LE_OP shift_expression
	| relational_expression GE_OP shift_expression
	;

equality_expression
	: relational_expression
	| equality_expression EQ_OP relational_expression
	| equality_expression NE_OP relational_expression
	;

and_expression
	: equality_expression
	| and_expression '&' equality_expression
	;

exclusive_or_expression
	: and_expression
	| exclusive_or_expression '^' and_expression
	;

inclusive_or_expression
	: exclusive_or_expression
	| inclusive_or_expression '|' exclusive_or_expression
	;

logical_and_expression
	: inclusive_or_expression
	| logical_and_expression AND_OP inclusive_or_expression
	;

logical_or_expression
	: logical_and_expression
	| logical_or_expression OR_OP logical_and_expression
	;

conditional_expression
	: logical_or_expression
	| logical_or_expression '?' expression ':' conditional_expression
	;

assignment_expression
	: conditional_expression
	| unary_expression assignment_operator assignment_expression
	;

assignment_operator
	: '='
	| MUL_ASSIGN
	| DIV_ASSIGN
	| MOD_ASSIGN
	| ADD_ASSIGN
	| SUB_ASSIGN
	| LEFT_ASSIGN
	| RIGHT_ASSIGN
	| AND_ASSIGN
	| XOR_ASSIGN
	| OR_ASSIGN
	;

expression
	: assignment_expression
	| expression ',' assignment_expression
	;

constant_expression
	: conditional_expression	/* with constraints */
	;

declaration
	: declaration_specifiers ';'
	| declaration_specifiers init_declarator_list ';' {
    }
	| static_assert_declaration
	;

declaration_specifiers
	: storage_class_specifier declaration_specifiers {
    }
	| storage_class_specifier {
    }
	| type_specifier declaration_specifiers {
    }
	| type_specifier {
    }
	| type_qualifier declaration_specifiers {
    }
	| type_qualifier {
    }
	| function_specifier declaration_specifiers {
    }
	| function_specifier {
    }
	| alignment_specifier declaration_specifiers {
    }
	| alignment_specifier {
    }
	;

init_declarator_list
	: init_declarator {
    }
	| init_declarator_list ',' init_declarator {
    }
	;

init_declarator
	: declarator '=' initializer {
    }
	| declarator {
    }
	;

storage_class_specifier
	: TYPEDEF {
    }
	| EXTERN {
    }
	| STATIC {
    }
	| THREAD_LOCAL {
    }
	| AUTO {
    }
	| REGISTER {
    }
	;

type_specifier
	: VOID {
    }
	| CHAR {
    }
	| SHORT {
    }
	| INT {
    }
	| LONG {
    }
	| FLOAT {
    }
	| DOUBLE {
    }
	| SIGNED {
    }
	| UNSIGNED {
    }
	| BOOL {
    }
	| COMPLEX {
    }
	| IMAGINARY	{
    }
	| atomic_type_specifier {
    }
	| struct_or_union_specifier {
    }
	| enum_specifier {
    }
	| TYPEDEF_NAME {
    }
	;

struct_or_union_specifier
	: struct_or_union '{' struct_declaration_list '}' {
    }
	| struct_or_union IDENTIFIER '{' struct_declaration_list '}' {
    }
	| struct_or_union IDENTIFIER {
    }
	;

struct_or_union
	: STRUCT {
    }
	| UNION {
    }
	;

struct_declaration_list
	: struct_declaration {
    }
	| struct_declaration_list struct_declaration {
    }
	;

struct_declaration
	: specifier_qualifier_list ';' {
    }
	| specifier_qualifier_list struct_declarator_list ';' {
    }
	| static_assert_declaration {
    }
    | direct_declarator ';' {
    }
	;

specifier_qualifier_list
	: type_specifier specifier_qualifier_list {
    }
	| type_specifier {
    }
	| type_qualifier specifier_qualifier_list {
    }
	| type_qualifier {
    }
	;

struct_declarator_list
	: struct_declarator
	| struct_declarator_list ',' struct_declarator
	;

struct_declarator
	: ':' constant_expression
	| declarator ':' constant_expression
	| declarator
	;

enum_specifier
	: ENUM '{' enumerator_list '}'
	| ENUM '{' enumerator_list ',' '}'
	| ENUM IDENTIFIER '{' enumerator_list '}'
	| ENUM IDENTIFIER '{' enumerator_list ',' '}'
	| ENUM IDENTIFIER
	;

enumerator_list
	: enumerator
	| enumerator_list ',' enumerator
	;

enumerator	/* identifiers must be flagged as ENUMERATION_CONSTANT */
	: enumeration_constant '=' constant_expression
	| enumeration_constant
	;

atomic_type_specifier
	: ATOMIC '(' type_name ')'
	;

type_qualifier
	: CONST {
    }
	| RESTRICT {
    }
	| VOLATILE {
    }
    | ATOMIC {
    }
	;

function_specifier
	: INLINE {
    }
	| NORETURN {
    }
	;

alignment_specifier
	: ALIGNAS '(' type_name ')' {
    }
	| ALIGNAS '(' constant_expression ')' {
    }
	;

declarator
	: pointer direct_declarator {
    }
	| direct_declarator {
    }
	;

direct_declarator
	: IDENTIFIER {
    }
	| '(' declarator ')' {
    }
	| direct_declarator '[' ']' {
    }
	| direct_declarator '[' '*' ']' {
    }
	| direct_declarator '[' STATIC type_qualifier_list assignment_expression ']' {
    }
	| direct_declarator '[' STATIC assignment_expression ']' {
    }
	| direct_declarator '[' type_qualifier_list '*' ']' {
    }
	| direct_declarator '[' type_qualifier_list STATIC assignment_expression ']' {
    }
	| direct_declarator '[' type_qualifier_list assignment_expression ']' {
    }
	| direct_declarator '[' type_qualifier_list ']' {
    }
	| direct_declarator '[' assignment_expression ']' {
    }
	| direct_declarator '(' parameter_type_list ')' {
    }
	| direct_declarator '(' ')' {
    }
	| direct_declarator '(' identifier_list ')' {
    }
	;

pointer
	: '*' type_qualifier_list pointer {
    }
	| '*' type_qualifier_list {
    }
	| '*' pointer {
    }
	| '*' {
    }
	;

type_qualifier_list
	: type_qualifier 
    {
    }
	| type_qualifier_list type_qualifier 
    {
    }
	;


parameter_type_list
	: parameter_list ',' ELLIPSIS
	| parameter_list
	;

parameter_list
	: parameter_declaration
	| parameter_list ',' parameter_declaration
	;

parameter_declaration
	: declaration_specifiers declarator
	| declaration_specifiers abstract_declarator
	| declaration_specifiers
	;

identifier_list
	: IDENTIFIER
	| identifier_list ',' IDENTIFIER
    | ',' identifier_list
	;

type_name
	: specifier_qualifier_list abstract_declarator
	| specifier_qualifier_list
	;

abstract_declarator
	: pointer direct_abstract_declarator
	| pointer
	| direct_abstract_declarator
	;

direct_abstract_declarator
	: '(' abstract_declarator ')'
	| '[' ']'
	| '[' '*' ']'
	| '[' STATIC type_qualifier_list assignment_expression ']'
	| '[' STATIC assignment_expression ']'
	| '[' type_qualifier_list STATIC assignment_expression ']'
	| '[' type_qualifier_list assignment_expression ']'
	| '[' type_qualifier_list ']'
	| '[' assignment_expression ']'
	| direct_abstract_declarator '[' ']'
	| direct_abstract_declarator '[' '*' ']'
	| direct_abstract_declarator '[' STATIC type_qualifier_list assignment_expression ']'
	| direct_abstract_declarator '[' STATIC assignment_expression ']'
	| direct_abstract_declarator '[' type_qualifier_list assignment_expression ']'
	| direct_abstract_declarator '[' type_qualifier_list STATIC assignment_expression ']'
	| direct_abstract_declarator '[' type_qualifier_list ']'
	| direct_abstract_declarator '[' assignment_expression ']'
	| '(' ')'
	| '(' parameter_type_list ')'
	| direct_abstract_declarator '(' ')'
	| direct_abstract_declarator '(' parameter_type_list ')'
	;

initializer
	: '{' initializer_list '}'
	| '{' initializer_list ',' '}'
	| assignment_expression
	;

initializer_list
	: designation initializer
	| initializer
	| initializer_list ',' designation initializer
	| initializer_list ',' initializer
	;

designation
	: designator_list '='
	;

designator_list
	: designator
	| designator_list designator
	;

designator
	: '[' constant_expression ']'
	| '.' IDENTIFIER
	;

static_assert_declaration
	: STATIC_ASSERT '(' constant_expression ',' STRING_LITERAL ')' ';'
	;

statement
	: labeled_statement
	| compound_statement
	| expression_statement
	| selection_statement
	| iteration_statement
	| jump_statement
	;

labeled_statement
	: IDENTIFIER ':' statement
	| CASE constant_expression ':' statement
	| DEFAULT ':' statement
	;

compound_statement
	: '{' '}'
	| '{'  block_item_list '}'
	;

block_item_list
	: block_item
	| block_item_list block_item
	;

block_item
	: declaration
	| statement
	;

expression_statement
	: ';'
	| expression ';'
	;

selection_statement
	: IF '(' expression ')' statement ELSE statement
	| IF '(' expression ')' statement
	| SWITCH '(' expression ')' statement
	;

iteration_statement
	: WHILE '(' expression ')' statement
	| DO statement WHILE '(' expression ')' ';'
	| FOR '(' expression_statement expression_statement ')' statement
	| FOR '(' expression_statement expression_statement expression ')' statement
	| FOR '(' declaration expression_statement ')' statement
	| FOR '(' declaration expression_statement expression ')' statement
	;

jump_statement
	: GOTO IDENTIFIER ';'
	| CONTINUE ';'
	| BREAK ';'
	| RETURN ';'
	| RETURN expression ';'
	;

translation_unit
	: external_declaration {
    }
	| translation_unit external_declaration {
    }
	;

external_declaration
	: function_definition
	| declaration
	;

function_definition
	: declaration_specifiers declarator declaration_list compound_statement
	| declaration_specifiers declarator compound_statement
	;

declaration_list
	: declaration
	| declaration_list declaration
    ;