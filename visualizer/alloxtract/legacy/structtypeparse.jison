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

{L}{A}*					               %{
                                            console.log('IDENTIFIER ', yytext);
                                            if (yy.types.includes(yytext)) {
                                                return 'TYPEDEF_NAME';
                                            } else {
                                                return 'IDENTIFIER';
                                            }
                                        %}

{HP}{H}+{IS}?				           %{
                                            console.log(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
{NZ}{D}*{IS}?				           %{
                                            console.log(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
"0"{O}*{IS}?				           %{
                                            console.log(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
{CP}?"'"([^'\\\n]|{ES})+"'"		       %{
                                            console.log(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
{D}+{E}{FS}?				           %{
                                            console.log(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{D}*"."{D}+{E}?{FS}?			       %{
                                            console.log(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{D}+"."{E}?{FS}?			           %{
                                            console.log(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{HP}{H}+{P}{FS}?			           %{
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

%start struct_or_union_specifier

%%

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
    | TYPEDEF STRUCT {
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

struct_declarator_list
    : struct_declarator
    | struct_declarator_list ',' struct_declarator
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

static_assert_declaration
	: STATIC_ASSERT '(' constant_expression ',' STRING_LITERAL ')' ';'
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

identifier_list
	: IDENTIFIER
	| identifier_list ',' IDENTIFIER
    | ',' identifier_list
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
    | typedef_name {
    }
    ;

atomic_type_specifier
	: ATOMIC '(' type_name ')'
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

type_name
	: specifier_qualifier_list abstract_declarator
	| specifier_qualifier_list
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

typedef_name
    : TYPEDEF_NAME {
    }
    ;








