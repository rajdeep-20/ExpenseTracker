package com.raj.userService.consumer;

import com.raj.userService.entity.UserInfo;
import com.raj.userService.entity.UserInfoDto;
import com.raj.userService.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class AuthServiceConsumer {

    @Autowired
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @KafkaListener(topics = "${spring.kafka.topic-json.name}", groupId = "${spring.kafka.consumer.group-id}")
    public void listen(UserInfoDto event)
    {
        try{
            userService.createOrUpdateUser(event);
        }
        catch (Exception ex) {
            ex.printStackTrace();
            System.out.println("AuthServiceConfig : Exception thrown while consuming an event");
        }
    }
}
