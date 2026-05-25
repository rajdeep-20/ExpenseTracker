package com.raj.expenseService.controller;

import com.raj.expenseService.dto.ExpenseDto;
import com.raj.expenseService.service.ExpenseService;
import com.sun.net.httpserver.HttpsServer;
import jakarta.annotation.Nonnull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/expense/v1")
public class ExpenseController {

    private final ExpenseService expenseService;

    @Autowired
    ExpenseController (ExpenseService expenseService)
    {
        this.expenseService = expenseService;
    }

    @GetMapping(path = "/getExpense")
    public ResponseEntity<List<ExpenseDto>> getExpenses(@RequestHeader(value = "X-User-Id") @Nonnull String userId)
    {
        try{
            List<ExpenseDto> kharche = expenseService.getExpense(userId);
            return new ResponseEntity<>(kharche, HttpStatus.OK);
        }
        catch (Exception e)
        {
            return new ResponseEntity<>((HttpHeaders) null, HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping(path = "/addExpense")
    public ResponseEntity<Boolean>
    addExpense(@RequestHeader(value = "X-User-Id") @Nonnull String userId, @RequestBody ExpenseDto expenseDto)
    {
        try{
            expenseDto.setUserId(userId);
            return new ResponseEntity<>(expenseService.createExpense(expenseDto), HttpStatus.CREATED);

        } catch (Exception e) {
            return new ResponseEntity<>(false, HttpStatus.BAD_REQUEST);
        }
    }


    @GetMapping("health")
    public ResponseEntity<Boolean> health()
    {
        return new ResponseEntity<>(true, HttpStatus.OK);
    }
}
