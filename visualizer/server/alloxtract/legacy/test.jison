%lex


%options easy_keyword_rules

/* D [0-9] */

%%
\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\b  %{    if (Number(yytext) == 0) {
                                return 'ZERO';
                            } else {
                                return 'NUMBER';
                            }
                      %}
"*"                   return '*';
"/"                   return '/';
"-"                   return '-';
"+"                   return '+';
"^"                   return '^';
"("                   return '(';
")"                   return ')';
"PI"                  return 'PI';
"E"                   return 'E';
<<EOF>>               return 'EOF';

/lex

%start expressions

%%

expressions
    : e EOF
        {
            console.log($1);
            return $1;
        }
    ;

e
    : e '+' e
        {
            $$ = $1 + $3;
        }
    | NUMBER
        {
            console.log("NUMBER", yytext)
            $$ = Number(yytext);
        }
    | ZERO
        {
            console.log("ZERO", yytext)
            $$ = 0;
        }
    ;