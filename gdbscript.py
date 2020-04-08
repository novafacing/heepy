import gdb
import gef

def update_heap_info():
    """
    Update info when breakpoint reached
    """
    pass

class MallocFinishBreakpoint(gdb.FinishBreakpoint):
    """
    Updates heap state so that it can be redrawn.
    """
    def stop(self):
        update_heap_info()
        return False

class MallocHookBreakpoint(gdb.Breakpoint):
    def stop(self):
        MallocFinishBreakpoint()
        return False # Continue execution

def get_arena():
    gef.reset_all_caches()
    gef.set_arch()
    return gef.get_main_arena()

gdb.execute("b *main")
gdb.execute("r")
arena = get_arena()
print(arena)
print(arena.tcachebin(0))

#MallocHookBreakpoint("malloc")
#gdb.execute("continue")
