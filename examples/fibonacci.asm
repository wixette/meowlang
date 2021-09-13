Jmp
4
1                ;; The first number.
1                ;; The second number.
Push
10               ;; Start loop 1. Repeat 10 times.
Load             ;; Start loop 2. Output the second number.
3
Meow
Push
1
Sub
Je
16
Jmp
8
Pop              ;; End loop 2.
Ret
Load             ;; Push the first number.
2
Load             ;; Push the second number.
3
Add
Load             ;; Shift the second number to the first position.
3
Save
2
Pop
Save             ;; Save the new sum as the second number.
3
Pop
Push
1
Sub
Je
38
Jmp
6
Pop              ;; End loop 1.
Nop
