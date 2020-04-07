trace_malloc: trace_malloc.c
	gcc -ldl -shared -o trace_malloc.so trace_malloc.c -fPIC

tests: tests/do_everything.c tests/tcache_poisoning.c tests/test_freelists.c
	gcc tests/do_everything.c -o tests/do_everything
	gcc tests/tcache_poisoning.c -o tests/tcache_poisoning
	gcc tests/test_freelists.c -o tests/test_freelists
