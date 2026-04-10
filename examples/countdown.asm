Jmp       ;; Skip data, jump to loop start.
3
10        ;; Element 2: Loop counter, counts down from 10 to 1.

;; Loop start (element 3):
Load      ;; Load the current counter value onto the stack.
2
Meow      ;; Print (counter) cat emojis on this line.
Ret       ;; Print a newline.
Push      ;; Prepare to decrement: push constant 1.
1
Sub       ;; counter - 1.
Save      ;; Write the new counter value back to element 2.
2
Je        ;; If the counter has reached zero, exit the loop.
17
Pop       ;; Otherwise, clean the used value off the stack and loop again.
Jmp
3

;; Exit (element 17):
Pop       ;; Clean the final zero off the stack.
Nop
