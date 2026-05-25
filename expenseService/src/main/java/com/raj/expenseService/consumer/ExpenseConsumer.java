package com.raj.expenseService.consumer;

import com.raj.expenseService.controller.ExpenseController;
import com.raj.expenseService.dto.ExpenseDto;
import com.raj.expenseService.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExpenseConsumer {
    private ExpenseService expenseService;

    @Autowired
    ExpenseConsumer(ExpenseService expenseService)
    {
        this.expenseService = expenseService;
    }

    @KafkaListener(topics = "${spring.kafka.topic-json.name}", groupId = "${spring.kafka.consumer.group-id}")
    public void listen(ExpenseDto eventData)
    {
        try{
            expenseService.createExpense(eventData);
        }
        catch (Exception e)
        {
            e.printStackTrace();
            System.out.println("AuthServiceConfig : Exception throw while consuming an event");
        }
    }

}
