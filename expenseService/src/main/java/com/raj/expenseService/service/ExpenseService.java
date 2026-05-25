package com.raj.expenseService.service;


import com.raj.expenseService.dto.ExpenseDto;
import com.raj.expenseService.entities.Expense;
import com.raj.expenseService.repository.ExpenseRepository;
import org.hibernate.annotations.NaturalId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service

public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    ExpenseService(ExpenseRepository expenseRepository)
    {
        this.expenseRepository = expenseRepository;
    }

    public boolean createExpense(ExpenseDto expenseDto)
    {
        setCurrency(expenseDto);
        try{
            expenseRepository.save(objectMapper.convertValue(expenseDto, Expense.class));
            return true;
        }
        catch (Exception e)
        {
            return false;
        }
    }


    public boolean updateExpense(ExpenseDto expenseDto)
    {
        setCurrency(expenseDto);
        Optional<Expense> expenseFoundOpt = expenseRepository.findByUserIdAndExternalId(expenseDto.getUserId(), expenseDto.getExternalId());

        if(expenseFoundOpt.isEmpty())
        {
            return false;
        }
        Expense expense = expenseFoundOpt.get();
        expense.setAmount(expenseDto.getAmount());
        expense.setMerchant((expenseDto.getMerchant()));
        expense.setCurrency((expenseDto.getCurrency()));
        expenseRepository.save(expense);
        return true;
    }


    public List<ExpenseDto> getExpense(String userId)
    {
        List<Expense> data = expenseRepository.findByUserId(userId);
        return objectMapper.convertValue(data, new TypeReference<List<ExpenseDto>>(){});
    }


    private void setCurrency(ExpenseDto expenseDto)
    {
        if(Objects.isNull(expenseDto.getCurrency()))
        {
            expenseDto.setCurrency("inr");
        }
    }


}
