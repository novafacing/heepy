%lex

%options easy_keyword_rules

%{
    yy.debug = (token) => {
        // console.log(token);
        return;
    };
    yy.strip = (token) => {
        token = token.replace(/\n/g, '');
        token = token.replace(/\t/g, '');
        token = token.replace(/\\/g, '');
        token = token.replace(/[ ]+/g, ' ');
        return token.trim();
    };
    yy.emit = (token) => {
        if (yy && !('code' in yy)) {
            yy.code = '';
        }
        yy.code = yy.code + token;
    };
    yy.srccompress = (source) => {
        source = source.replace(/[\n]+/g, '\n');
        source = source.replace(/\t/g, '');
        return source;
    };
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

%s define define_body

%%



"/*"[^*]*"*"(?:[^/*][^*]*"*"+)*"/"     /* ignore */
"//".*                                  /* ignore */
"#"[\t ]*"define"                       this.begin('define');
                                        %{
                                            yy.debug(yytext);
                                            return 'PDEFINE';
                                        %}
"#"[\t ]*"undef"                        this.begin('define');
                                        %{
                                            yy.debug(yytext);
                                            return 'PUNDEF';
                                        %}
"#"[\t ]*"else"[^\n]*\n                 %{
                                            yy.debug(yytext);
                                            return 'PELSE'
                                        %}
"#"[\t ]*"include"                      %{
                                            yy.debug(yytext);
                                            return 'PINCLUDE';
                                        %}
"#"[\t ]*"ifndef"                       this.begin('define');
                                        %{
                                            yy.debug(yytext);
                                            return 'PIFNDEF';
                                        %}
"#"[\t ]*"endif"                        %{
                                            yy.debug(yytext);
                                            return 'PENDIF';
                                        %}
"#"[\t ]*"ifdef"                        this.begin('define');
                                        %{
                                            yy.debug(yytext);
                                            return 'PIFDEF';
                                        %}
"#"[\t ]*"if"                           this.begin('define'); 
                                        %{
                                            yy.debug(yytext);
                                            return 'PIF';
                                        %}
\<[\/a-zA-Z0-9_.-]+.h\>                 %{
                                            yy.debug(yytext);
                                            return 'GLOBAL_INCLUDE';
                                        %}
\<[\/a-zA-Z0-9_.-]+.hpp\>               %{
                                            yy.debug(yytext);
                                            return 'GLOBAL_INCLUDE';
                                        %}
\<[\/a-zA-Z0-9_.-]+.hh\>                %{
                                            yy.debug(yytext);
                                            return 'GLOBAL_INCLUDE';
                                        %}
<define>[ \t]*{L}{A}*                   this.begin('define_body');
                                        %{
                                            yy.debug(yytext);
                                            return 'DEFINE_ID';
                                        %}
<define_body>([^\n\\](\\\n)?)*\n        this.begin('INITIAL');
                                        %{
                                            yy.debug(yytext);
                                            return 'DEFINE_BODY';
                                        %}
{WS}+                                   %{
                                            yy.emit(yytext);
                                        %}
.                                       %{
                                            yy.emit(yytext);
                                        %}

/lex

%start goal

%%

goal
    : translation_unit {
        $$ = {};
        $$.defines = $1;
        $$.code = yy.srccompress(yy.code);
    }
    ;

translation_unit
    : unit {
        $$ = {};
        if ($1 && 'define' in $1) {
            var def = $1.define;
            $$[yy.strip(def.id)] = yy.strip(def.body);
        }
    }
    | translation_unit unit {
        $$ = $1;
        if ($2 && 'define' in $2) {
            var def = $2.define;
            $$[yy.strip(def.id)] = yy.strip(def.body);
        }
    }
    ;

unit
    :
    | PDEFINE DEFINE_ID DEFINE_BODY {
        $$ = {
            'define': {
                id: $2,
                body: $3
            }
        };
    }
    | PUNDEF DEFINE_ID DEFINE_BODY {
        $$ = {
            'undef': {
                'undef': $2
            }
        };
    }
    | PUNDEF {
        $$ = {
            'undef': {
                'undef': $1
            }
        }
    }
    | PELSE {
        $$ = {
            'else': {
                'else': $1
            }
        };
    }
    | PINCLUDE GLOBAL_INCLUDE {
        $$ = {
            'include': {
                'include': $1,
                'global_include': $2
            }
        };
    }
    | PINCLUDE {
        $$ = {
            'include': {
                'include': $1
            }
        };
    }
    | PIFNDEF DEFINE_ID DEFINE_BODY {
        $$ = {
            'ifndef': {
                'ifndef': $2
            }
        };
    }
    | PIFNDEF {
        $$ = {
            'ifndef': {
                'ifndef': $1
            }
        };
    }
    | PENDIF {
        $$ = {
            'endif': {
                'endif': $1
            }
        };
    }
    | PIFDEF DEFINE_ID DEFINE_BODY {
        $$ = {
            'ifdef': {
                'ifdef': $1
            }
        };
    }
    | PIFDEF {
        $$ = {
            'ifdef': {
                'ifdef': $1
            }
        };
    }
    | PIF DEFINE_ID DEFINE_BODY {
        $$ = {
            'if': {
                'if': $2
            }
        };
    }
    | PIF {
        $$ = {
            'if': {
                'if': $1
            }
        };
    }
    ;

