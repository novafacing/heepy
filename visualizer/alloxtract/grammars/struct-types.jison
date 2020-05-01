%lex

%options easy_keyword_rules

%{
    yy.types = [];
    yy.enumConstants = [];
    yy.vars = [];
%}

O   [0-7]
D   [0-9]
NZ  [1-9]
L   [a-zA-Z]
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
"char"                                  %{
                                            return 'CHAR'; 
                                        %}
"const"                                 %{
                                            return 'CONST'; 
                                        %}
"double"                                %{
                                            return 'DOUBLE'; 
                                        %}
"float"                                 %{
                                            return 'FLOAT'; 
                                        %}
"int"                                   %{
                                            return 'INT'; 
                                        %}
"long"                                  %{
                                            return 'LONG'; 
                                        %}
"register"                              %{
                                            return 'REGISTER'; 
                                        %}
"restrict"                              %{
                                            return 'RESTRICT'; 
                                        %}
"short"                                 %{
                                            return 'SHORT'; 
                                        %}
"signed"                                %{
                                            return 'SIGNED'; 
                                        %}
"unsigned"                              %{
                                            return 'UNSIGNED'; 
                                        %}
"void"                                  %{
                                            return 'VOID'; 
                                        %}
"volatile"                              %{
                                            return 'VOLATILE'; 
                                        %}
"_Bool"                                 %{
                                            return 'BOOL'; 
                                        %}
"}"                                     %{
                                            return '}';
                                        %}
"{"                                     %{
                                            return '{';
                                        %}
";"                                     %{
                                            return ';';
                                        %}
"struct"                               %{
                                            return 'STRUCT';
                                        %}
{L}{A}*					                %{
                                            return 'IDENTIFIER';
                                        %}
"__"{A}*                                %{
                                            return 'BUILTIN';
                                        %}

{WS}+                                   /* ignore */
.                                       /* ignore */ 

/lex

%start struct

%%

struct
    : 
    | STRUCT IDENTIFIER '{' struct_declarator_list '}' ';' {
        $$ = Array.from(new Set($4));
    }
    ;

struct_declarator_list
    : struct_declarator {
        $$ = new Array();
        if ($1) {
            $$.push($1);
        }
    }
    | struct_declarator_list struct_declarator {
        $$ = $1;
        if ($2) {
            $$.push($2);
        }
    }
    ;

struct_declarator
    :
    | identifier_list ';' {
        if ($1.length >= 1) {
            $$ = $1[0];
        } else {
            $$ = null;
        }
    }
    ;

identifier_list
    : IDENTIFIER {
        $$ = new Array();
        $$.push($1);
    }
    | specifier_qualifier_list identifier_list {
        $$ = new Array();
    }
    | STRUCT identifier_list {
        $$ = new Array();
    }
    | BUILTIN identifier_list {
        $$ = new Array();
    }
    | identifier_list IDENTIFIER {
        $$ = $1;
        $$.push($2);
    }
    ;

specifier_qualifier_list
	: type_specifier specifier_qualifier_list {
        $$ = $2;
    }
	| type_specifier {
        $$ = new Array();
    }
	| type_qualifier specifier_qualifier_list {
        $$ = $2;
    }
	| type_qualifier {
        $$ = new Array();
    }
	;

type_specifier
	: VOID {
        $$ = $1;
    }
	| CHAR {
        $$ = $1;
    }
	| SHORT {
        $$ = $1;
    }
	| INT {
        $$ = $1;
    }
	| LONG {
        $$ = $1;
    }
	| FLOAT {
        $$ = $1;
    }
	| DOUBLE {
        $$ = $1;
    }
	| SIGNED {
        $$ = $1;
    }
	| UNSIGNED {
        $$ = $1;
    }
	| BOOL {
        $$ = $1;
    }
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
