package com.example;

import org.graalvm.nativeimage.c.function.CEntryPoint;
import org.graalvm.nativeimage.IsolateThread;
import org.graalvm.word.WordFactory;

public class Math {

    public static void main(String[] args) {
        if (args.length == 3) {
            String op = args[0];
            int a = Integer.parseInt(args[1]);
            int b = Integer.parseInt(args[2]);
            if ("add".equalsIgnoreCase(op)) {
                int res = add(WordFactory.nullPointer(), a, b);
                System.out.println("RESULT: " + res);
            } else if ("multiply".equalsIgnoreCase(op)) {
                int res = multiply(WordFactory.nullPointer(), a, b);
                System.out.println("RESULT: " + res);
            } else {
                System.out.println("Unknown operation: " + op);
            }
        } else {
            System.out.println("Hello from Java WASM! (Run with [op, a, b] to calculate)");
            // Test call for startup verification
            System.out.println("Startup Check: 10 + 20 = " + add(WordFactory.nullPointer(), 10, 20));
        }
    }

    @CEntryPoint(name = "add")
    public static int add(IsolateThread thread, int a, int b) {
        return a + b;
    }

    @CEntryPoint(name = "multiply")
    public static int multiply(IsolateThread thread, int a, int b) {
        return a * b;
    }
}
