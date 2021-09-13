Jmp
4
1                ;; The first number.
1                ;; The second number.
Push             ;; Start loop. Repeat 10 times.
10
Load             ;; Print the first number.
2
Meow
Ret
Pop
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
31
Jmp
6
Pop              ;; End loop.
Nop
