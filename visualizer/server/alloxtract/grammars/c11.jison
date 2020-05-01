%lex

%options easy_keyword_rules

%{
    var fs = require('fs');
    var path = require('path');

    var mallocAlignment = () => {
        return 2 * yy.ptrsize;
    }

    var mallocAlignMask = () => {
        return mallocAlignment() - 1;
    }

    var offsetOf = (structure, name) => {
        var offset = 0;
        for (prop in structure) {
            if (prop === name) {
                return offset;
            }
            offset += structure[prop].size;
        }
        return offset;
    }

    var minChunkSize = () => {
        var mallocChunk = JSON.parse(fs.readFileSync(path.join(yy.structpath, yy.libc, 'malloc_chunk.json'), { encoding: 'utf8' }));
        return offsetOf(mallocChunk, 'fd_nextsize');
    }

    var minSize = () => {
        return (((minChunkSize() + mallocAlignMask()) & ~mallocAlignMask()));
    }

    var sizeSz = () => {
        return yy.ptrsize;
    }

    var maxFastSize = () => {
        return (80 * sizeSz() / 4);
    }

    var request2size = (req) => {
        return (((req) + sizeSz() + mallocAlignMask() < minSize()) ? minSize() : ((req) + sizeSz() + mallocAlignMask()) & ~mallocAlignMask())
    }
    
    var bitsPerMap = () => {
        return (1 << yy.defines.BINMAPSHIFT);
    }
    var fastbinIndex = (size) => {
        return (((size) >> (yy.ptrsize == 8 ? 4 : 3)) - 2);
    }
    yy.debug = (token) => {
        // console.log(token);
        return;
    };
    yy.special = {
        'NFASTBINS': () => {
            return fastbinIndex(request2size(maxFastSize())) + 1;
            
        },
        'BINMAPSIZE': () => {
            return (yy.defines.NBINS / bitsPerMap());
        }
    }
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
                                            yy.debug(yytext);
                                            return 'AUTO'; 
                                        %}
"break"                                 %{
                                            yy.debug(yytext);
                                            return 'BREAK'; 
                                        %}
"case"                                  %{
                                            yy.debug(yytext);
                                            return 'CASE'; 
                                        %}
"char"                                  %{
                                            yy.debug(yytext);
                                            return 'CHAR'; 
                                        %}
"const"                                 %{
                                            yy.debug(yytext);
                                            return 'CONST'; 
                                        %}
"continue"                              %{
                                            yy.debug(yytext);
                                            return 'CONTINUE'; 
                                        %}
"default"                               %{
                                            yy.debug(yytext);
                                            return 'DEFAULT'; 
                                        %}
"do"                                    %{
                                            yy.debug(yytext);
                                            return 'DO'; 
                                        %}
"double"                                %{
                                            yy.debug(yytext);
                                            return 'DOUBLE'; 
                                        %}
"else"                                  %{
                                            yy.debug(yytext);
                                            return 'ELSE'; 
                                        %}
"enum"                                  %{
                                            yy.debug(yytext);
                                            return 'ENUM'; 
                                        %}
"extern"                                %{
                                            yy.debug(yytext);
                                            return 'EXTERN'; 
                                        %}
"float"                                 %{
                                            yy.debug(yytext);
                                            return 'FLOAT'; 
                                        %}
"for"                                   %{
                                            yy.debug(yytext);
                                            return 'FOR'; 
                                        %}
"goto"                                  %{
                                            yy.debug(yytext);
                                            return 'GOTO'; 
                                        %}
"if"                                    %{
                                            yy.debug(yytext);
                                            return 'IF'; 
                                        %}
"inline"                                %{
                                            yy.debug(yytext);
                                            return 'INLINE'; 
                                        %}
"int"                                   %{
                                            yy.debug(yytext);
                                            return 'INT'; 
                                        %}
"long"                                  %{
                                            yy.debug(yytext);
                                            return 'LONG'; 
                                        %}
"register"                              %{
                                            yy.debug(yytext);
                                            return 'REGISTER'; 
                                        %}
"restrict"                              %{
                                            yy.debug(yytext);
                                            return 'RESTRICT'; 
                                        %}
"return"                                %{
                                            yy.debug(yytext);
                                            return 'RETURN'; 
                                        %}
"short"                                 %{
                                            yy.debug(yytext);
                                            return 'SHORT'; 
                                        %}
"signed"                                %{
                                            yy.debug(yytext);
                                            return 'SIGNED'; 
                                        %}
"sizeof"                                %{
                                            yy.debug(yytext);
                                            return 'SIZEOF'; 
                                        %}
"static"                                %{
                                            yy.debug(yytext);
                                            return 'STATIC'; 
                                        %}
"struct"                                %{
                                            yy.debug(yytext);
                                            return 'STRUCT'; 
                                        %}
"switch"                                %{
                                            yy.debug(yytext);
                                            return 'SWITCH'; 
                                        %}
"typedef"                               %{
                                            yy.debug(yytext);
                                            return 'TYPEDEF'; 
                                        %}
"union"                                 %{
                                            yy.debug(yytext);
                                            return 'UNION'; 
                                        %}
"unsigned"                              %{
                                            yy.debug(yytext);
                                            return 'UNSIGNED'; 
                                        %}
"void"                                  %{
                                            yy.debug(yytext);
                                            return 'VOID'; 
                                        %}
"volatile"                              %{
                                            yy.debug(yytext);
                                            return 'VOLATILE'; 
                                        %}
"while"                                 %{
                                            yy.debug(yytext);
                                            return 'WHILE'; 
                                        %}
"_Alignas"                              %{
                                            yy.debug(yytext);
                                            return 'ALIGNAS'; 
                                        %}
"_Alignof"                              %{
                                            yy.debug(yytext);
                                            return 'ALIGNOF'; 
                                        %}
"_Atomic"                               %{
                                            yy.debug(yytext);
                                            return 'ATOMIC'; 
                                        %}
"_Bool"                                 %{
                                            yy.debug(yytext);
                                            return 'BOOL'; 
                                        %}
"_Complex"                              %{
                                            yy.debug(yytext);
                                            return 'COMPLEX'; 
                                        %}
"_Generic"                              %{
                                            yy.debug(yytext);
                                            return 'GENERIC'; 
                                        %}
"_Imaginary"                            %{
                                            yy.debug(yytext);
                                            return 'IMAGINARY'; 
                                        %}
"_Noreturn"                             %{
                                            yy.debug(yytext);
                                            return 'NORETURN'; 
                                        %}
"_Static_assert"                        %{
                                            yy.debug(yytext);
                                            return 'STATIC_ASSERT'; 
                                        %}
"_Thread_local"                         %{
                                            yy.debug(yytext);
                                            return 'THREAD_LOCAL'; 
                                        %}
"__func__"                              %{
                                            yy.debug(yytext);
                                            return 'FUNC_NAME';
                                        %}

{L}{A}*					                %{
                                            yy.debug(yy.types);
                                            if (yy.types.includes(yytext)) {
                                                yy.debug('TYPEDEF_NAME ' + yytext);
                                                return 'TYPEDEF_NAME';
                                            } else if (yy.enumConstants.includes(yytext)) {
                                                yy.debug('ENUMERATION_CONSTANT ' + yytext);
                                                return 'ENUMERATION_CONSTANT';
                                            } else {
                                                yy.debug('IDENTIFIER ' + yytext);
                                                return 'IDENTIFIER';
                                            }
                                        %}

{HP}{H}+{IS}?				            %{
                                            yy.debug(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
{NZ}{D}*{IS}?				            %{
                                            yy.debug(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
"0"{O}*{IS}?				            %{
                                            yy.debug(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
{CP}?"'"([^'\\\n]|{ES})+"'"		        %{
                                            yy.debug(yytext);
                                            return 'I_CONSTANT'; 
                                        %}
{D}+{E}{FS}?				            %{
                                            yy.debug(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{D}*"."{D}+{E}?{FS}?			        %{
                                            yy.debug(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{D}+"."{E}?{FS}?			            %{
                                            yy.debug(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{HP}{H}+{P}{FS}?			            %{
                                            yy.debug(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{HP}{H}*"."{H}+{P}{FS}?                 %{
                                            yy.debug(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
{HP}{H}+"."{P}{FS}?                     %{
                                            yy.debug(yytext);
                                            return 'F_CONSTANT'; 
                                        %}
({SP}?\"([^"\\\n]|{ES})*\"{WS}*)+       %{
                                            yy.debug(yytext);
                                            return 'STRING_LITERAL'; 
                                        %}

"..."                                   %{
                                            yy.debug(yytext);
                                            return 'ELLIPSIS'; 
                                        %}
">>="                                   %{
                                            yy.debug(yytext);
                                            return 'RIGHT_ASSIGN'; 
                                        %}
"<<="                                   %{
                                            yy.debug(yytext);
                                            return 'LEFT_ASSIGN'; 
                                        %}
"+="                                    %{
                                            yy.debug(yytext);
                                            return 'ADD_ASSIGN'; 
                                        %}
"-="                                    %{
                                            yy.debug(yytext);
                                            return 'SUB_ASSIGN'; 
                                        %}
"*="                                    %{
                                            yy.debug(yytext);
                                            return 'MUL_ASSIGN'; 
                                        %}
"/="                                    %{
                                            yy.debug(yytext);
                                            return 'DIV_ASSIGN'; 
                                        %}
"%="                                    %{
                                            yy.debug(yytext);
                                            return 'MOD_ASSIGN'; 
                                        %}
"&="                                    %{
                                            yy.debug(yytext);
                                            return 'AND_ASSIGN'; 
                                        %}
"^="                                    %{
                                            yy.debug(yytext);
                                            return 'XOR_ASSIGN'; 
                                        %}
"|="                                    %{
                                            yy.debug(yytext);
                                            return 'OR_ASSIGN'; 
                                        %}
">>"                                    %{
                                            yy.debug(yytext);
                                            return 'RIGHT_OP'; 
                                        %}
"<<"                                    %{
                                            yy.debug(yytext);
                                            return 'LEFT_OP'; 
                                        %}
"++"                                    %{
                                            yy.debug(yytext);
                                            return 'INC_OP'; 
                                        %}
"--"                                    %{
                                            yy.debug(yytext);
                                            return 'DEC_OP'; 
                                        %}
"->"                                    %{
                                            yy.debug(yytext);
                                            return 'PTR_OP'; 
                                        %}
"&&"                                    %{
                                            yy.debug(yytext);
                                            return 'AND_OP'; 
                                        %}
"||"                                    %{
                                            yy.debug(yytext);
                                            return 'OR_OP'; 
                                        %}
"<="                                    %{
                                            yy.debug(yytext);
                                            return 'LE_OP'; 
                                        %}
">="                                    %{
                                            yy.debug(yytext);
                                            return 'GE_OP'; 
                                        %}
"=="                                    %{
                                            yy.debug(yytext);
                                            return 'EQ_OP'; 
                                        %}
"!="                                    %{
                                            yy.debug(yytext);
                                            return 'NE_OP'; 
                                        %}
";"                                     %{
                                            yy.debug(yytext);
                                            return ';'; 
                                        %}
("{"|"<%")                              %{
                                            yy.debug(yytext);
                                            return '{'; 
                                        %}
("}"|"%>")                              %{
                                            yy.debug(yytext);
                                            return '}'; 
                                        %}
","                                     %{
                                            yy.debug(yytext);
                                            return ','; 
                                        %}
":"                                     %{
                                            yy.debug(yytext);
                                            return ':'; 
                                        %}
"="                                     %{
                                            yy.debug(yytext);
                                            return '='; 
                                        %}
"("                                     %{
                                            yy.debug(yytext);
                                            return '('; 
                                        %}
")"                                     %{
                                            yy.debug(yytext);
                                            return ')'; 
                                        %}
("["|"<:")                              %{
                                            yy.debug(yytext);
                                            return '['; 
                                        %}
("]"|":>")                              %{
                                            yy.debug(yytext);
                                            return ']'; 
                                        %}
"."                                     %{
                                            yy.debug(yytext);
                                            return '.'; 
                                        %}
"&"                                     %{
                                            yy.debug(yytext);
                                            return '&'; 
                                        %}
"!"                                     %{
                                            yy.debug(yytext);
                                            return '!'; 
                                        %}
"~"                                     %{
                                            yy.debug(yytext);
                                            return '~'; 
                                        %}
"-"                                     %{
                                            yy.debug(yytext);
                                            return '-'; 
                                        %}
"+"                                     %{
                                            yy.debug(yytext);
                                            return '+'; 
                                        %}
"*"                                     %{
                                            yy.debug(yytext);
                                            return '*'; 
                                        %}
"/"                                     %{
                                            yy.debug(yytext);
                                            return '/'; 
                                        %}
"%"                                     %{
                                            yy.debug(yytext);
                                            return '%'; 
                                        %}
"<"                                     %{
                                            yy.debug(yytext);
                                            return '<'; 
                                        %}
">"                                     %{
                                            yy.debug(yytext);
                                            return '>'; 
                                        %}
"^"                                     %{
                                            yy.debug(yytext);
                                            return '^'; 
                                        %}
"|"                                     %{
                                            yy.debug(yytext);
                                            return '|'; 
                                        %}
"?"                                     %{
                                            yy.debug(yytext);
                                            return '?'; 
                                        %}
{WS}+                                   /* ignore */
.                                       /* ignore */

/lex

%start translation_unit

%%

primary_expression
	: IDENTIFIER {
        if ($1 in yy.special) {
            $$ =  yy.special[$1]();
        } else if ($1 in yy.defines) {
            $$ = yy.defines[$1];
        } else {
            $$ = $1;
        }
    }
	| constant {
        $$ = $1;
    }
	| string {
        $$ = $1;
    }
	| '(' expression ')' {
        $$ = {
            type: 'primary_expression',
            expression: $2
        };
    }
	| generic_selection {
        $$ = {
            type: 'primary_expression',
            'generic_selection': $1
        };
    }
	;

constant
	: I_CONSTANT {
        $$ = $1;
    }
	| F_CONSTANT {
        $$ = $1;
    }
	| ENUMERATION_CONSTANT {
        $$ = $1;
    }
	;

enumeration_constant		/* before it has been defined as such */
	: IDENTIFIER {
        $$ = {
            type: 'enumeration_constant',
            identifier: $1
        };
    }
	;

string
	: STRING_LITERAL {
        $$ = $1;
    }
	| FUNC_NAME {
        $$ = $1;
    }
	;

generic_selection
	: GENERIC '(' assignment_expression ',' generic_assoc_list ')' {
        $$ = {
            type: 'generic_selection',
            'assignment_expression': $3,
            'generic_assoc_list': $5
        };
    }
	;

generic_assoc_list
	: generic_association {
        $$ = {
            type: 'generic_assoc_list',
            'generic_association': $1
        };
    }
	| generic_assoc_list ',' generic_association {
        $$ = {
            type: 'generic_assoc_list',
            'generic_assoc_list': $1,
            'generic_association': $3
        };
    }
	;

generic_association
	: type_name ':' assignment_expression {
        $$ = {
            type: 'generic_association',
            'type_name': $1,
            'assignment_expression': $3
        };
    }
	| DEFAULT ':' assignment_expression {
        $$ = {
            type: 'generic_association',
            'assignment_expression': $3
        };
    }
	;

postfix_expression
	: primary_expression {
        $$ = $1;
    }
	| postfix_expression '[' expression ']' {
        $$ = {
            type: 'postfix_expression',
            'postfix_expression': $1,
            expression: $3
        };
    }
	| postfix_expression '(' ')' {
        $$ = {
            type: 'postfix_expression',
            'postfix_expression': $1
        };
    }
	| postfix_expression '(' argument_expression_list ')' {
        $$ = {
            type: 'postfix_expression',
            'postfix_expression': $1,
            'argument_expression_list': $3
        };
    }
	| postfix_expression '.' IDENTIFIER {
        $$ = {
            type: 'postfix_expression',
            'postfix_expression': $1,
            identifier: $3
        };
    }
	| postfix_expression PTR_OP IDENTIFIER {
        $$ = {
            type: 'postfix_expression',
            'postfix_expression': $1,
            identifier: $3
        };
    }
	| postfix_expression INC_OP {
        $$ = {
            type: 'postfix_expression',

        };
    }
	| postfix_expression DEC_OP {
        $$ = {
            type: 'postfix_expression',

        };
    }
	| '(' type_name ')' '{' initializer_list '}' {
        $$ = {
            type: 'postfix_expression',
            'type_name': $2,
            'initializer_list': $5
        };
    }
	| '(' type_name ')' '{' initializer_list ',' '}' {
        $$ = {
            type: 'postfix_expression',
            'type_name': $2,
            'initializer_list': $5

        };
    }
	;

argument_expression_list
	: assignment_expression {
        $$ = {
            type: 'argument_expression_list',
            'assignment_expression': $1
        };
    }
	| argument_expression_list ',' assignment_expression {
        $$ = {
            type: 'argument_expression_list',
            'argument_expression_list': $1,
            'assignment_expression': $3
        };
    }
	;

unary_expression /* TODO: Add sizeof/alignof */
	: postfix_expression {
        $$ = $1;
    }
	| INC_OP unary_expression {
        $$ = {
            type: 'unary_expression',
            'unary_expression': $2
        };
    }
	| DEC_OP unary_expression {
        $$ = {
            type: 'unary_expression',
            'unary_expression': $2
        };
    }
	| unary_operator cast_expression {
        $$ = {
            type: 'unary_expression',
            'unary_operator': $1,
            'cast_expression': $2
        };
    }
	| SIZEOF unary_expression {
        $$ = {
            type: 'unary_expression',
            'unary_expression': $2
        };
    }
	| SIZEOF '(' type_name ')' {
        $$ = {
            type: 'unary_expression',
            'type_name': $3
        };
    }
	| ALIGNOF '(' type_name ')' {
        $$ = {
            type: 'unary_expression',
            'type_name': $3
        };
    }
	;

unary_operator
	: '&' {
        $$ = {
            type: 'unary_operator',
            'unary_operator': $1
        };
    }
	| '*' {
        $$ = {
            type: 'unary_operator',
            'unary_operator': $1
        };
    }
	| '+' {
        $$ = {
            type: 'unary_operator',
            'unary_operator': $1
        };
    }
	| '-' {
        $$ = {
            type: 'unary_operator',
            'unary_operator': $1
        };
    }
	| '~' {
        $$ = {
            type: 'unary_operator',
            'unary_operator': $1
        };
    }
	| '!' {
        $$ = {
            type: 'unary_operator',
            'unary_operator': $1
        };
    }
	;

cast_expression
	: unary_expression {
        $$ = $1;
    }
	| '(' type_name ')' cast_expression {
        $$ = {
            type: 'cast_expression',
            'type_name': $2,
            'cast_expression': $4
        };
    }
	;

/* We can't operate on values we don't know for this use case (alloxtract).
 * replace with something else for any other use case though!
 */
multiplicative_expression /* TODO: Add * / % */
	: cast_expression {
        $$ = $1;
    }
	| multiplicative_expression '*' cast_expression {
        $$ = $1 * $3;
    }
	| multiplicative_expression '/' cast_expression {
        $$ = $1 / $3;
    }
	| multiplicative_expression '%' cast_expression {
        $$ = $1 % $3;
    }
	;

additive_expression /* TODO: Add +- */
	: multiplicative_expression {
        $$ = $1;
    }
	| additive_expression '+' multiplicative_expression {
        $$ = $1 + $3;
    }
	| additive_expression '-' multiplicative_expression {
        $$ = $1 - $3;
    }
	;

shift_expression /* TODO: Add << >> */
	: additive_expression {
        $$ = $1;
    }
	| shift_expression LEFT_OP additive_expression {
        $$ = $1 << $3;
    }
	| shift_expression RIGHT_OP additive_expression {
        $$ = $1 >> $3;
    }
	;

relational_expression /* TODO: Add lt/gt/lge/geq */
	: shift_expression {
        $$ = $1;
    }
	| relational_expression '<' shift_expression {
        $$ = {
            type: 'relational_expression',
            'relational_expression': $1,
            less: true,
            equal: false,
            'shift_expression': $3
        };
    }
	| relational_expression '>' shift_expression {
        $$ = {
            type: 'relational_expression',
            'relational_expression': $1,
            less: false,
            equal: false,
            'shift_expression': $3
        };
    }
	| relational_expression LE_OP shift_expression {
        $$ = {
            type: 'relational_expression',
            'relational_expression': $1,
            less: true,
            equal: true,
            'shift_expression': $3
        };
    }
	| relational_expression GE_OP shift_expression {
        $$ = {
            type: 'relational_expression',
            'relational_expression': $1,
            less: false,
            equal: true,
            'shift_expression': $3
        };
    }
	;

equality_expression
	: relational_expression {
        $$ = $1;
    }
	| equality_expression EQ_OP relational_expression {
        $$ = {
            type: 'equality_expression',
            'equality_expression': $1,
            'relational_expression': $3
        };
    }
	| equality_expression NE_OP relational_expression {
        $$ = {
            type: 'equality_expression',
            'equality_expression': $1,
            'relational_expression': $3
        };
    }
	;

and_expression
	: equality_expression {
        $$ = $1;
    }
	| and_expression '&' equality_expression {
        $$ = $1 & $3;
    }
	;

exclusive_or_expression
	: and_expression {
        $$ = $1;
    }
	| exclusive_or_expression '^' and_expression {
        $$ = $1 ^ $3;
    }
	;

inclusive_or_expression
	: exclusive_or_expression {
        $$ = $1;
    }
	| inclusive_or_expression '|' exclusive_or_expression {
        $$ = $1 | $3;
    }
	;

logical_and_expression
	: inclusive_or_expression {
        $$ = $1;
    }
	| logical_and_expression AND_OP inclusive_or_expression {
        $$ = {
            type: 'logical_and_expression',
            'logical_and_expression': $1,
            'inclusive_or_expression': $3
        };
    }
	;

logical_or_expression
	: logical_and_expression {
        $$ = $1;
    }
	| logical_or_expression OR_OP logical_and_expression {
        $$ = {
            type: 'logical_and_expression',
            'logical_or_expression': $1,
            'logical_and_expression': $3
        };
    }
	;

conditional_expression
	: logical_or_expression {
        $$ = $1;
    }
	| logical_or_expression '?' expression ':' conditional_expression {
        $$ = {
            type: 'conditional_expression',
            'logical_or_expression': $1,
            'expression_statement': $3,
            'conditional_expression': $5
        };
    }
	;

assignment_expression
	: conditional_expression {
        $$ = $1;
    }
	| unary_expression assignment_operator assignment_expression {
        $$ = {
            type: 'assignment_expression',
            'unary_expression': $1,
            'assignment_operator': $2,
            'assignment_expression': $3
        };
    }
	;

assignment_operator
	: '=' {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	| MUL_ASSIGN {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	| DIV_ASSIGN {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	| MOD_ASSIGN {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	| ADD_ASSIGN {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	| SUB_ASSIGN {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	| LEFT_ASSIGN {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	| RIGHT_ASSIGN {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	| AND_ASSIGN {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	| XOR_ASSIGN {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	| OR_ASSIGN {
        $$ = {
            type: 'assignment_operator',
            'assignment_operator': $1
        };
    }
	;

expression
	: assignment_expression {
        $$ = $1;
    }
	| expression ',' assignment_expression {
        $$ = {
            type: 'expression',
            expression: $1,
            'assignment_expression': $3
        }
    }
	;

constant_expression
	: conditional_expression {
        $$ = $1;
    }
	;

declaration
	: declaration_specifiers ';' {
        $$ = {
            type: 'declaration',
            'declaration_specifiers': $1
        };
    }
	| declaration_specifiers init_declarator_list ';' {
        $$ = {
            type: 'declaration',
            'declaration_specifiers': $1,
            'init_declarator_list': $2
        };
    }
	| static_assert_declaration {
        $$ = {
            type: 'declaration',
            'static_assert_declaration': $1
        };
    }
	;

declaration_specifiers
	: storage_class_specifier declaration_specifiers {
        $$ = {
            type: 'declaration_specifiers',
            'storage_class_specifier': $1,
            'declaration_specifiers': $2
        };
    }
	| storage_class_specifier {
        $$ = {
            type: 'declaration_specifiers',
            'storage_class_specifier': $1
        };

    }
	| type_specifier declaration_specifiers {
        $$ = {
            type: 'declaration_specifiers',
            'type_specifier': $1,
            'declaration_specifiers': $2
        };
    }
    | type_specifier {
        $$ = {
            type: 'declaration_specifiers',
            'type_specifier': $1
        };
    }
	| type_qualifier declaration_specifiers {
        $$ = {
            type: 'declaration_specifiers',
            'type_qualifier': $1,
            'declaration_specifiers': $2
        };
    }
	| type_qualifier {
        $$ = {
            type: 'declaration_specifiers',
            'type_qualifier': $1
        };
        
    }
	| function_specifier declaration_specifiers {
        $$ = {
            type: 'declaration_specifiers',
            'function_specifier': $1,
            'declaration_specifiers': $2
        };
    }
	| function_specifier {
        $$ = {
            type: 'declaration_specifiers',
            'function_specifier': $1
        };
    }
	| alignment_specifier declaration_specifiers {
        $$ = {
            type: 'declaration_specifiers',
            'alignment_specifier': $1,
            'declaration_specifiers': $2
        };
    }
	| alignment_specifier {
        $$ = {
            type: 'declaration_specifiers',
            'alignment_specifier': $1
        };
    }
	;

init_declarator_list
	: init_declarator {
        $$ = {
            type: 'init_declarator_list',
            'init_declarator': $1
        };
    }
	| init_declarator_list ',' init_declarator {
        $$ = {
            type: 'init_declarator_list',
            'init_declarator_list': $1,
            'init_declarator_list': $3
        };
    }
	;

init_declarator
	: declarator '=' initializer {
        $$ = {
            type: 'init_declarator',
            declarator: $1,
            initializer: $2
        };
    }
	| declarator {
        $$ = {
            type: 'init_declarator',
            declarator: $1
        };
    }
	;

storage_class_specifier
	: TYPEDEF {
        $$ = {
            type: 'storage_class_specifier',
            'storage_class_specifier': $1
        };
    }
	| EXTERN {
        $$ = {
            type: 'storage_class_specifier',
            'storage_class_specifier': $1
        };
    }
	| STATIC {
        $$ = {
            type: 'storage_class_specifier',
            'storage_class_specifier': $1
        };
    }
	| THREAD_LOCAL {
        $$ = {
            type: 'storage_class_specifier',
            'storage_class_specifier': $1
        };
    }
	| AUTO {
        $$ = {
            type: 'storage_class_specifier',
            'storage_class_specifier': $1
        };
    }
	| REGISTER {
        $$ = {
            type: 'storage_class_specifier',
            'storage_class_specifier': $1
        };
    }
	;

type_specifier
	: VOID {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| CHAR {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| SHORT {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| INT {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| LONG {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| FLOAT {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| DOUBLE {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| SIGNED {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| UNSIGNED {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| BOOL {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| COMPLEX {
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| IMAGINARY	{
        $$ = {
            type: 'type_specifier',
            'type_specifier': $1
        };
    }
	| atomic_type_specifier {
        $$ = {
            type: 'type_specifier',
            'atomic_type_specifier': $1
        };
    }
	| struct_or_union_specifier {
        $$ = {
            type: 'type_specifier',
            'struct_or_union_specifier': $1
        };
    }
	| enum_specifier {
        $$ = {
            type: 'type_specifier',
            'enum_specifier': $1
        };
    }
	| TYPEDEF_NAME {
        $$ = {
            type: 'type_specifier',
            'typedef_name': $1
        };
    }
	;

struct_or_union_specifier
	: struct_or_union '{' struct_declaration_list '}' {
        $$ = {
            type: 'struct_or_union_specifier',
            'struct_or_union': $1,
            'struct_declaration_list': $3.reverse()
        };
    }
	| struct_or_union IDENTIFIER '{' struct_declaration_list '}' {
        $$ = {
            type: 'struct_or_union_specifier',
            'struct_or_union': $1,
            identifier: $2,
            'struct_declaration_list': $4.reverse()
        };
    }
	| struct_or_union TYPEDEF_NAME '{' struct_declaration_list '}' {
        $$ = {
            type: 'struct_or_union_specifier',
            'struct_or_union': $1,
            identifier: $2,
            'struct_declaration_list': $4.reverse()
        };
    }
	| struct_or_union IDENTIFIER {
        $$ = {
            type: 'struct_or_union_specifier',
            'struct_or_union': $1,
            identifier: $2
        };
    }
	| struct_or_union TYPEDEF_NAME {
        $$ = {
            type: 'struct_or_union_specifier',
            'struct_or_union': $1,
            identifier: $2
        };
    }
	;

struct_or_union
	: STRUCT {
        $$ = {
            type: 'struct_or_union',
            'struct_or_union': $1
        };
    }
	| UNION {
        $$ = {
            type: 'struct_or_union',
            'struct_or_union': $1
        };
    }
	;

struct_declaration_list
	: struct_declaration {
        $$ = new Array();
        $$.push($1);
    }
	| struct_declaration_list struct_declaration {
        $$ = $1;
        $$.unshift($2);
    }
	;

struct_declaration
	: specifier_qualifier_list ';' {
        $$ = {
            type: 'struct_declaration',
            'specifier_qualifier_list': $1
        };
    }
	| specifier_qualifier_list struct_declarator_list ';' {
        $$ = {
            type: 'struct_declaration',
            'specifier_qualifier_list': $1,
            'struct_declarator_list': $2
        };
    }
	| static_assert_declaration {
        $$ = {
            type: 'struct_declaration',
            'static_assert_declaration': $1
        };
    }
    | direct_declarator ';' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1
        };
    }
	;

specifier_qualifier_list
	: type_specifier specifier_qualifier_list {
        $$ = $2;
        $$.unshift($1);
    }
	| type_specifier {
        $$ = new Array();
        $$.push($1);
    }
	| type_qualifier specifier_qualifier_list {
        $$ = $1;
        $$.unshift($1);
    }
	| type_qualifier {
        $$ = new Array();
        $$.push($1);
    }
	;

struct_declarator_list
	: struct_declarator {
        $$ = new Array();
        $$.push($1);
    }
	| struct_declarator_list ',' struct_declarator {
        $$ = $1;
        $$.push($3);
    }
	;

struct_declarator
	: ':' constant_expression {
        $$ = {
            type: 'struct_declarator',
            'constant_expression': $2
        };
    }
	| declarator ':' constant_expression {
        $$ = {
            type: 'struct_declarator',
            declarator: $1,
            'constant_expression': $3
        };
    }
	| declarator {
        $$ = {
            type: 'struct_declarator',
            declarator: $1
        };
    }
	;

enum_specifier
	: ENUM '{' enumerator_list '}' {
    }
	| ENUM '{' enumerator_list ',' '}' {
    }
	| ENUM IDENTIFIER '{' enumerator_list '}' {
    }
	| ENUM IDENTIFIER '{' enumerator_list ',' '}' {
    }
	| ENUM IDENTIFIER {
    }
	;

enumerator_list
	: enumerator {
    }
	| enumerator_list ',' enumerator {
    }
	;

enumerator	/* identifiers must be flagged as ENUMERATION_CONSTANT */
	: enumeration_constant '=' constant_expression {
    }
	| enumeration_constant {
    }
	;

atomic_type_specifier
	: ATOMIC '(' type_name ')' {
        $$ = {
            type: 'atomic_type_specifier',
            atomic: true,
            'type_name': $3
        };
    }
	;

type_qualifier
	: CONST {
        $$ = {
            type: 'type_qualifier',
            'type_qualifier': $1
        };
    }
	| RESTRICT {
        $$ = {
            type: 'type_qualifier',
            'type_qualifier': $1
        };
    }
	| VOLATILE {
        $$ = {
            type: 'type_qualifier',
            'type_qualifier': $1
        };
    }
    | ATOMIC {
        $$ = {
            type: 'type_qualifier',
            'type_qualifier': $1
        };
    }
	;

function_specifier
	: INLINE {
        $$ = {
            type: 'function_specifier',
            'function_specifier': $1
        };
    }
	| NORETURN {
        $$ = {
            type: 'function_specifier',
            'function_specifier': $1
        };
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
        $$ = {
            type: 'declarator',
            pointer: $1,
            'direct_declarator': $2
        };
    }
	| direct_declarator {
        $$ = {
            type: 'declarator',
            'direct_declarator': $1
        };
    }
	;

direct_declarator
	: IDENTIFIER {
        $$ = {
            type: 'direct_declarator',
            identifier: $1
        };
    }
	| '(' declarator ')' {
        $$ = {
            type: 'direct_declarator',
            declarator: $2
        };
    }
	| direct_declarator '[' ']' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1
        };
    }
	| direct_declarator '[' '*' ']' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1
        };
    }
	| direct_declarator '[' STATIC type_qualifier_list assignment_expression ']' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1,
            'type_qualifier_list': $4,
            'assignment_expression': $5
        };
    }
	| direct_declarator '[' STATIC assignment_expression ']' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1,
            'assignment_expression': $3
        };
    }
	| direct_declarator '[' type_qualifier_list '*' ']' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1,
            'type_qualifier_list': $3
        };
    }
	| direct_declarator '[' type_qualifier_list STATIC assignment_expression ']' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1,
            'type_qualifier_list': $3,
            'assignment_expression': $5
        };
    }
	| direct_declarator '[' type_qualifier_list assignment_expression ']' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1,
            'type_qualifier_list': $3,
            'assignment_expression': $4
        };
    }
	| direct_declarator '[' type_qualifier_list ']' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1,
            'type_qualifier_list': $3,
        };
    }
	| direct_declarator '[' assignment_expression ']' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1,
            'assignment_expression': $3,
        };
    }
	| direct_declarator '(' parameter_type_list ')' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1,
            'parameter_type_list': $3,
        };
    }
	| direct_declarator '(' ')' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1
        };
    }
	| direct_declarator '(' identifier_list ')' {
        $$ = {
            type: 'direct_declarator',
            'direct_declarator': $1,
            'identifier_list': $3
        };
    }
	;

pointer
	: '*' type_qualifier_list pointer {
        $$ = {
            type: 'pointer',
            'type_qualifier_list': $2,
            pointer: $3
        };
    }
	| '*' type_qualifier_list {
        $$ = {
            type: 'pointer',
            'type_qualifier_list': $2
        };
    }
	| '*' pointer {
        $$ = {
            type: 'pointer',
            pointer: $2
        };
    }
	| '*' {
        $$ = {
            type: 'pointer'
        }
    }
	;

type_qualifier_list
	: type_qualifier {
        $$ = {
            type: 'type_qualifier_list',
            'type_qualifier': $1
        };
    }
	| type_qualifier_list type_qualifier {
        $$ = {
            type: 'type_qualifier_list',
            'type_qualifier': $1,
            'type_qualifier_list': $2
        };
    }
	;

parameter_type_list
	: parameter_list ',' ELLIPSIS {
    }
	| parameter_list {
    }
	;

parameter_list
	: parameter_declaration {
    }
	| parameter_list ',' parameter_declaration {
    }
	;

parameter_declaration
	: declaration_specifiers declarator {
    }
	| declaration_specifiers abstract_declarator {
    }
	| declaration_specifiers {
    }
	;

identifier_list
	: IDENTIFIER {
        $$ = new Array();
        $$.push($1);
    }
	| identifier_list ',' IDENTIFIER {
        $$ = $1;
        $$.push($3);
    }
    | ',' identifier_list {
        $$ = $2;
    }
	;

type_name
	: specifier_qualifier_list abstract_declarator {
    }
	| specifier_qualifier_list {
    }
	;

abstract_declarator
	: pointer direct_abstract_declarator {
    }
	| pointer {
    }
	| direct_abstract_declarator {
    }
	;

direct_abstract_declarator
	: '(' abstract_declarator ')' {
    }
	| '[' ']' {
    }
	| '[' '*' ']' {
    }
	| '[' STATIC type_qualifier_list assignment_expression ']' {
    }
	| '[' STATIC assignment_expression ']' {
    }
	| '[' type_qualifier_list STATIC assignment_expression ']' {
    }
	| '[' type_qualifier_list assignment_expression ']' {
    }
	| '[' type_qualifier_list ']' {
    }
	| '[' assignment_expression ']' {
    }
	| direct_abstract_declarator '[' ']' {
    }
	| direct_abstract_declarator '[' '*' ']' {
    }
	| direct_abstract_declarator '[' STATIC type_qualifier_list assignment_expression ']' {
    }
	| direct_abstract_declarator '[' STATIC assignment_expression ']' {
    }
	| direct_abstract_declarator '[' type_qualifier_list assignment_expression ']' {
    }
	| direct_abstract_declarator '[' type_qualifier_list STATIC assignment_expression ']' {
    }
	| direct_abstract_declarator '[' type_qualifier_list ']' {
    }
	| direct_abstract_declarator '[' assignment_expression ']' {
    }
	| '(' ')' {
    }
	| '(' parameter_type_list ')' {
    }
	| direct_abstract_declarator '(' ')' {
    }
	| direct_abstract_declarator '(' parameter_type_list ')' {
    }
	;

initializer
	: '{' initializer_list '}' {
        $$ = {
            type: 'initializer',
            'initializer_list': $2
        }
    }
	| '{' initializer_list ',' '}' {
        $$ = {
            type: 'initializer',
            'initializer_list': $2
        }
    }
	| assignment_expression {
        $$ = {
            type: 'initializer',
            'assignment_expression': $1
        }
    }
	;

initializer_list
	: designation initializer {
    }
	| initializer {
    }
	| initializer_list ',' designation initializer {
    }
	| initializer_list ',' initializer {
    }
	;

designation
	: designator_list '=' {
    }
	;

designator_list
	: designator {
    }
	| designator_list designator {
    }
	;

designator
	: '[' constant_expression ']' {
    }
	| '.' IDENTIFIER {
    }
	;

static_assert_declaration
	: STATIC_ASSERT '(' constant_expression ',' STRING_LITERAL ')' ';' {
        $$ = {
            type: 'static_assert_declaration',
            'constant_expression': $3,
            'string_literal': $5
        };
    }
	;

statement
	: labeled_statement {
    }
	| compound_statement {
    }
	| expression_statement {
    }
	| selection_statement {
    }
	| iteration_statement {
    }
	| jump_statement {
    }
	;

labeled_statement
	: IDENTIFIER ':' statement {
    }
	| CASE constant_expression ':' statement {
    }
	| DEFAULT ':' statement {
    }
	;

compound_statement
	: '{' '}' {
    }
	| '{'  block_item_list '}' {
    }
	;

block_item_list
	: block_item {
    }
	| block_item_list block_item {
    }
	;

block_item
	: declaration {
    }
	| statement {
    }
	;

expression_statement
	: ';' {
    }
	| expression ';' {
    }
	;

selection_statement
	: IF '(' expression ')' statement ELSE statement {
    }
	| IF '(' expression ')' statement {
    }
	| SWITCH '(' expression ')' statement {
    }
	;

iteration_statement
	: WHILE '(' expression ')' statement {
    }
	| DO statement WHILE '(' expression ')' ';' {
    }
	| FOR '(' expression_statement expression_statement ')' statement {
    }
	| FOR '(' expression_statement expression_statement expression ')' statement {
    }
	| FOR '(' declaration expression_statement ')' statement {
    }
	| FOR '(' declaration expression_statement expression ')' statement {
    }
	;

jump_statement
	: GOTO IDENTIFIER ';' {
    }
	| CONTINUE ';' {
    }
	| BREAK ';' {
    }
	| RETURN ';' {
    }
	| RETURN expression ';' {
    }
	;

translation_unit
	: external_declaration {
        $$ = {
            type: 'translation_unit',
            'external_declaration': $1
        };
    }
	| translation_unit external_declaration {
        $$ = {
            type: 'translation_unit',
            'translation_unit': $1,
            'external_declaration': $2
        };
    }
	;

external_declaration
	: function_definition {
        $$ = {
            type: 'external_declaration',
            'function_definition': $1
        }
    }
	| declaration {
        $$ = {
            type: 'external_declaration',
            declaration: $1
        }
    }
	;

function_definition
	: declaration_specifiers declarator declaration_list compound_statement {
    }
	| declaration_specifiers declarator compound_statement {
    }
	;

declaration_list
	: declaration {
        $$ = {
            type: 'declaration_list',
            declaration: $1
        };
    }
	| declaration_list declaration {
        $$ = {
            type: 'declaration_list',
            'declaration_list': $1,
            declaration: $2
        };
    }
    ;