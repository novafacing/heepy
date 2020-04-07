typedef struct malloc_chunk* mchunkptr;

struct malloc_chunk {
  size_t      mchunk_prev_size;  /* Size of previous chunk (if free).  */
  size_t      mchunk_size;       /* Size in bytes, including overhead. */
  struct malloc_chunk* fd;         /* double links -- used only if free. */
  struct malloc_chunk* bk;
  /* Only used for large blocks: pointer to next larger size.  */
  struct malloc_chunk* fd_nextsize; /* double links -- used only if free. */
  struct malloc_chunk* bk_nextsize;
};

typedef struct malloc_chunk *mfastbinptr;
typedef struct malloc_chunk *mbinptr;


#include<stddef.h>
#define MIN_CHUNK_SIZE        (offsetof(struct malloc_chunk, fd_nextsize))
#define MALLOC_ALIGN_MASK (2*sizeof(size_t) - 1)


#define MINSIZE  \
  (unsigned long)(((MIN_CHUNK_SIZE+MALLOC_ALIGN_MASK) & ~MALLOC_ALIGN_MASK))

#define request2size(req)                                         \
  (((req) + sizeof(size_t) + MALLOC_ALIGN_MASK < MINSIZE)  ?             \
   MINSIZE :                                                      \
   ((req) + sizeof(size_t) + MALLOC_ALIGN_MASK) & ~MALLOC_ALIGN_MASK)

#define fastbin_index(sz) \
  ((((unsigned int) (sz)) >> (sizeof(size_t) == 8 ? 4 : 3)) - 2)

#define MAX_FAST_SIZE     (80 * sizeof(size_t) / 4)
#define NFASTBINS  (fastbin_index (request2size (MAX_FAST_SIZE)) + 1)

#define NBINS             128
#define BINMAPSHIFT      5
#define BITSPERMAP       (1U << BINMAPSHIFT)
#define BINMAPSIZE       (NBINS / BITSPERMAP)




typedef struct malloc_state
{
  /* Serialize access.  */
  pthread_mutex_t somemutex;
  /* Flags (formerly in max_fast).  */
  int flags;
  /* Set if the fastbin chunks contain recently inserted free blocks.  */
  /* Note this is a bool but not all targets support atomics on booleans.  */
  int have_fastchunks;
  /* Fastbins */
  mfastbinptr fastbinsY[NFASTBINS];
  /* Base of the topmost chunk -- not otherwise kept in a bin */
  mchunkptr top;
  /* The remainder from the most recent split of a small request */
  mchunkptr last_remainder;
  /* Normal bins packed as described above */
  mchunkptr bins[NBINS * 2 - 2];
  /* Bitmap of bins */
  unsigned int binmap[BINMAPSIZE];
  /* Linked list */
  struct malloc_state *next;
  /* Linked list for free arenas.  Access to this field is serialized
     by free_list_lock in arena.c.  */
  struct malloc_state *next_free;
  /* Number of threads attached to this arena.  0 if the arena is on
     the free list.  Access to this field is serialized by
     free_list_lock in arena.c.  */
  size_t attached_threads;
  /* Memory allocated from the system in this arena.  */
  size_t system_mem;
  size_t max_system_mem;
} mstate;

extern void * __libc_malloc(size_t size);
extern void  __libc_free(void *ptr);
extern void * __libc_calloc(size_t nmemb, size_t size);
extern void * __libc_realloc(void *ptr, size_t size);
extern void * __libc_reallocarray(void *ptr, size_t nmemb, size_t size);

extern char * __libc_version;
