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
"}"                                     %{
                                            return '}';
                                        %}
"{"                                     %{
                                            return '{';
                                        %}
";"                                     %{
                                            return ';';
                                        %}
'*'                                     %{
                                            return '*';
                                        %}
"typedef"                               %{
                                            return 'TYPEDEF';
                                        %}
{L}{A}*					                %{
                                            return 'IDENTIFIER';
                                        %}

{WS}+                                   /* ignore */
.                                       /* ignore */ 

/lex

%start goal

%%

goal
    : 
    | typedef_statements external_tokens { 
        $$ = $1;
    }
    ;

external_token
    : '{'
    | '}'
    | ';'
    | '*'
    | IDENTIFIER {
    }
    ;

external_tokens
    :
    | external_token external_tokens
    | 
    ;

typedef_statements
    : {
        $$ = new Array();
    }
    | typedef_statement {
        $$ = new Array();
        $$.push($1);
    }
    | typedef_statements external_tokens typedef_statement {
        $$ = $1;
        $$.push($3);
    }
        
    ;

typedef_statement
    : TYPEDEF top_level_type_names IDENTIFIER ';' {
        var ptr = $2.includes('*');

        $$ = {
            type: $2.filter((val, idx, arr) => val !== '*'),
            pointer: ptr,
            id: $3
        }
    }
    ;

top_level_type_names
    : {
    }
    | top_level_type_name {
        $$ = new Array();
        $$.push($1);
    }
    | top_level_type_names top_level_type_name {
        $$ = $1;
        $$.push($2);
    }
    ;

top_level_type_name
    : '{' nested_type_names '}' {
        $$ = $2;
    }
    | '*' {
        $$ = $1;
    }
    | IDENTIFIER {
        $$ = $1;
    }
    ;

nested_type_names
    : {
        $$ = new Array();
    }
    | nested_type_names nested_type_name {
        $$ = $1;
        $$.push($2);

    }
    ;

nested_type_name
    : '{' nested_type_names '}' {
        $$ = $2;
    }
    | IDENTIFIER {
        $$ = new Array();
        $$.push($1);
    }
    | '*' {
        $$ = new Array();
        $$.push($1);
    }
    | ';' {
        $$ = new Array();
    }
    ;

